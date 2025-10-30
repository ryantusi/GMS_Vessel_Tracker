import express from "express";
import cors from "cors";
import "dotenv/config";
import { getFullData, getVesselData, getBatchData } from "./utils/apiData.js";
import { normalizeData } from "./utils/normalizer.js";
import { createSingleVesselMap, createBatchVesselMap } from "./utils/mapbox.js";
import cacheService from "./utils/cache.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Production CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:5173"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(new Error("CORS policy violation"), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Live Ship Vessel Tracker API",
    version: "1.0.0",
    cache: cacheService.isConnected() ? "enabled" : "disabled",
    endpoints: {
      single: "/api/vessel/:imo",
      batch: "/api/vessels/batch",
      cacheStats: "/api/cache/stats",
      clearCache: "DELETE /api/cache/vessel/:imo",
    },
  });
});

// Cache stats endpoint
app.get("/api/cache/stats", async (req, res) => {
  try {
    const stats = await cacheService.getStats();
    res.json({
      success: true,
      cacheEnabled: cacheService.isConnected(),
      ...stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get cache stats",
    });
  }
});

// Clear specific vessel cache (manual invalidation)
app.delete("/api/cache/vessel/:imo", async (req, res) => {
  try {
    const { imo } = req.params;
    await cacheService.deleteVessel(imo);
    res.json({
      success: true,
      message: `Cache cleared for IMO ${imo}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to clear cache",
    });
  }
});

// Single Vessel Route - WITH CACHING
app.get("/api/vessel/:imo", async (req, res) => {
  try {
    const { imo } = req.params;

    // Validate IMO
    if (!imo || isNaN(imo)) {
      return res.status(400).json({
        success: false,
        error: "Invalid IMO number provided",
      });
    }

    console.log(`\n🔍 Fetching data for IMO: ${imo}`);

    // Step 1: Check cache first
    let normalizedData = await cacheService.getVessel(imo);
    let fromCache = false;

    if (normalizedData) {
      // Cache hit! Use cached data
      fromCache = true;
      console.log(`✅ Using cached data for IMO ${imo}`);
    } else {
      // Cache miss - fetch from API
      console.log(`🌐 Fetching from API for IMO ${imo}`);

      // Get raw vessel data from API
      const rawData = await getFullData(imo);

      // Check if there was an error fetching data
      if (rawData.error) {
        return res.status(404).json({
          success: false,
          error: rawData.error,
          imo: imo,
        });
      }

      // Normalize the data
      normalizedData = await normalizeData(rawData);

      // Store in cache for 7 days
      await cacheService.setVessel(imo, normalizedData);
    }

    // Create map with vessel and destination markers
    const mapData = createSingleVesselMap(normalizedData);

    // Return response with cache indicator
    res.json({
      success: true,
      vessel: normalizedData,
      map: mapData,
      cached: fromCache, // Indicates if data came from cache
      cachedAt: normalizedData.cached_at || new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in /api/vessel/:imo:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

// Batch Vessels Route - WITH CACHING
app.post("/api/vessels/batch", async (req, res) => {
  try {
    const { imos } = req.body;

    // Validate input
    if (!imos || !Array.isArray(imos) || imos.length === 0) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid request. Please provide an array of IMO numbers in the request body.",
      });
    }

    // Validate all IMOs are numbers
    const invalidImos = imos.filter((imo) => isNaN(imo));
    if (invalidImos.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid IMO numbers found",
        invalid: invalidImos,
      });
    }

    console.log(`\n📦 Batch request for ${imos.length} vessels`);

    // Step 1: Check cache for all IMOs
    const cacheResults = await cacheService.getBatch(imos);
    const cachedVessels = Object.values(cacheResults.cached);
    const missingImos = cacheResults.missing;

    console.log(
      `📊 Cache: ${cachedVessels.length} hits, ${missingImos.length} misses`
    );

    let fetchedVessels = [];
    let failedVessels = [];

    // Step 2: Fetch missing vessels from API
    if (missingImos.length > 0) {
      console.log(`🌐 Fetching ${missingImos.length} vessels from API`);

      // Get raw batch data for missing IMOs
      const rawBatchData = await getBatchData(missingImos);

      // Normalize all vessel data
      const normalizedBatchData = await Promise.all(
        rawBatchData.map(async (rawData) => {
          if (rawData.error) {
            return rawData; // Keep error objects as-is
          }
          return await normalizeData(rawData);
        })
      );

      // Separate successful and failed from fetched data
      const successfulFetched = normalizedBatchData.filter((v) => !v.error);
      const failedFetched = normalizedBatchData.filter((v) => v.error);

      fetchedVessels = successfulFetched;
      failedVessels = failedFetched; // Store failed vessels

      // Cache only the successfully fetched vessels
      if (successfulFetched.length > 0) {
        await cacheService.setBatch(successfulFetched);
      }
    }

    // Step 3: Combine cached and successfully fetched vessels
    const allSuccessfulVessels = [...cachedVessels, ...fetchedVessels];

    // Step 4: Create map with all successful vessel locations
    const mapData = createBatchVesselMap(allSuccessfulVessels);

    // Step 5: Return response with cache stats
    res.json({
      success: true,
      totalRequested: imos.length,
      totalSuccess: allSuccessfulVessels.length,
      totalFailed: failedVessels.length,
      cachedCount: cachedVessels.length,
      fetchedCount: fetchedVessels.length,
      vessels: allSuccessfulVessels,
      failed: failedVessels.length > 0 ? failedVessels : undefined,
      map: mapData,
    });
  } catch (error) {
    console.error("Error in /api/vessels/batch:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing server...");
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚢 Ship Tracker API running on port ${PORT}`);
  console.log(`📍 Single vessel: GET http://localhost:${PORT}/api/vessel/:imo`);
  console.log(
    `📍 Batch vessels: POST http://localhost:${PORT}/api/vessels/batch`
  );
  console.log(
    `💾 Redis cache: ${cacheService.isConnected() ? "ENABLED" : "DISABLED"}`
  );
});
