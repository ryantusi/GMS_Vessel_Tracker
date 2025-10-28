import express from "express";
import cors from "cors";
import "dotenv/config";
import { getVesselData, getBatchData } from "./utils/apiData.js";
import { normalizeData } from "./utils/normalizer.js";
import { createSingleVesselMap, createBatchVesselMap } from "./utils/mapbox.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Live Ship Vessel Tracker API",
    version: "1.0.0",
    endpoints: {
      single: "/api/vessel/:imo",
      batch: "/api/vessels/batch",
    },
  });
});

// Single Vessel Route
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

    console.log(`Fetching data for IMO: ${imo}`);

    // 1. Get raw vessel data
    const rawData = await getVesselData(imo);

    // Check if there was an error fetching data
    if (rawData.error) {
      return res.status(404).json({
        success: false,
        error: rawData.error,
        imo: imo,
      });
    }

    // 2. Normalize the data
    const normalizedData = await normalizeData(rawData);

    // 3. Create map with vessel and destination markers
    const mapData = createSingleVesselMap(normalizedData);

    // 4. Return response
    res.json({
      success: true,
      vessel: normalizedData,
      map: mapData,
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

// Batch Vessels Route
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

    console.log(`Fetching batch data for ${imos.length} vessels...`);

    // 1. Get raw batch data
    const rawBatchData = await getBatchData(imos);

    // 2. Normalize all vessel data
    const normalizedBatchData = await Promise.all(
      rawBatchData.map(async (rawData) => {
        // Skip normalization if there was an error fetching
        if (rawData.error) {
          return rawData;
        }
        return await normalizeData(rawData);
      })
    );

    // 3. Separate successful and failed vessels
    const successfulVessels = normalizedBatchData.filter((v) => !v.error);
    const failedVessels = normalizedBatchData.filter((v) => v.error);

    // 4. Create map with all vessel locations (no destination ports for batch)
    const mapData = createBatchVesselMap(successfulVessels);

    // 5. Return response
    res.json({
      success: true,
      totalRequested: imos.length,
      totalSuccess: successfulVessels.length,
      totalFailed: failedVessels.length,
      vessels: successfulVessels,
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

// Start server
app.listen(PORT, () => {
  console.log(`🚢 Ship Tracker API running on port ${PORT}`);
  console.log(`📍 Single vessel: GET http://localhost:${PORT}/api/vessel/:imo`);
  console.log(
    `📍 Batch vessels: POST http://localhost:${PORT}/api/vessels/batch`
  );
});
