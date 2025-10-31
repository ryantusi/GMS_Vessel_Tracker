// Mock Database Implementation - Deployment Version
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load mock database
let mockDatabase = [];
try {
  const dbPath = join(__dirname, "../mock-vessels.json");
  const dbContent = readFileSync(dbPath, "utf-8");
  mockDatabase = JSON.parse(dbContent);
  console.log(`✅ Mock database loaded: ${mockDatabase.length} vessels`);
} catch (error) {
  console.error("❌ Failed to load mock database:", error.message);
  mockDatabase = [];
}

// Simulate API delay for realism
const simulateDelay = (ms = 100) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Get full vessel data by IMO (Mock version)
 * @param {string|number} imo - IMO number
 * @returns {Promise<Object>} Vessel data or error
 */
async function getFullData(imo) {
  const time = new Date();
  await simulateDelay(50 + Math.random() * 150);

  try {
    const imoNumber = parseInt(imo);
    const vessel = mockDatabase.find((v) => v.imo === imoNumber);

    if (!vessel) {
      console.log(
        `[No Data Returned for IMO: ${imo}] + ${time.toLocaleTimeString()}`
      );
      return { imo, error: "No data" };
    }

    console.log(
      `[Data Retrieved for IMO: ${imo}] + ${time.toLocaleTimeString()}`
    );

    // FIX: Return deep copy
    return JSON.parse(JSON.stringify(vessel));
  } catch (error) {
    console.error(`[Data Fetch Error for ${imo}] Details: ${error.message}`);
    return { imo, error: error.message };
  }
}

/**
 * Extract and normalize key vessel data
 * @param {string|number} imo - IMO number
 * @returns {Promise<Object>} Normalized vessel data
 */
async function getVesselData(imo) {
  const data = await getFullData(imo);

  if (data.error) {
    return { imo, error: data.error };
  }

  return {
    imo: data.imo || imo,
    name: data.name || "Unknown",
    type: data.type || "Unknown",
    ais_destination: data.ais_destination || "Unknown",
    latitude: data.latitude || null,
    longitude: data.longitude || null,
  };
}

/**
 * Get batch vessel data (no rate limiting needed for mock)
 * @param {Array<string|number>} imoList - Array of IMO numbers
 * @returns {Promise<Array>} Array of vessel data
 */
async function getBatchData(imoList) {
  const time = new Date();

  // Process all at once (no rate limiting needed for mock)
  const results = await Promise.all(imoList.map((imo) => getVesselData(imo)));

  console.log(
    `Batch Data Retrieval Complete ${time.toLocaleTimeString()} for IMOs: [${imoList.join(
      ", "
    )}]`
  );

  return results;
}

export { getFullData, getVesselData, getBatchData };
