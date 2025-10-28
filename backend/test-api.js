// test-api.js - Test your Express API endpoints
import fetch from "node-fetch";

const BASE_URL = "http://localhost:5000";

// Test data
const TEST_IMO = "9626390"; // Single vessel IMO
const TEST_IMOS = ["9626390", "9734678", "9960239"]; // Batch vessel IMOs

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Test 1: Root endpoint
async function testRoot() {
  log("\n🧪 TEST 1: Root Endpoint", colors.blue);
  log("━".repeat(50), colors.blue);

  try {
    const response = await fetch(`${BASE_URL}/`);
    const data = await response.json();

    if (response.ok) {
      log("✓ Root endpoint working", colors.green);
      console.log(data);
    } else {
      log("✗ Root endpoint failed", colors.red);
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, colors.red);
  }
}

// Test 2: Single vessel endpoint
async function testSingleVessel() {
  log("\n🧪 TEST 2: Single Vessel Endpoint", colors.blue);
  log("━".repeat(50), colors.blue);
  log(`Fetching IMO: ${TEST_IMO}`, colors.yellow);

  try {
    const response = await fetch(`${BASE_URL}/api/vessel/${TEST_IMO}`);
    const data = await response.json();

    if (response.ok && data.success) {
      log("✓ Single vessel endpoint working", colors.green);
      log(`\nVessel Details:`, colors.yellow);
      console.log({
        name: data.vessel.name,
        type: data.vessel.type,
        imo: data.vessel.imo,
        destination: data.vessel.ais_destination,
        coordinates: {
          lat: data.vessel.latitude,
          lon: data.vessel.longitude,
        },
      });

      log(`\nMap Data:`, colors.yellow);
      console.log({
        totalMarkers: data.map.markers.length,
        bounds: data.map.bounds,
        center: data.map.center,
      });
    } else {
      log("✗ Single vessel endpoint failed", colors.red);
      console.log(data);
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, colors.red);
  }
}

// Test 3: Batch vessels endpoint
async function testBatchVessels() {
  log("\n🧪 TEST 3: Batch Vessels Endpoint", colors.blue);
  log("━".repeat(50), colors.blue);
  log(`Fetching ${TEST_IMOS.length} vessels...`, colors.yellow);

  try {
    const response = await fetch(`${BASE_URL}/api/vessels/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imos: TEST_IMOS }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      log("✓ Batch vessels endpoint working", colors.green);
      log(`\nBatch Summary:`, colors.yellow);
      console.log({
        totalRequested: data.totalRequested,
        totalSuccess: data.totalSuccess,
        totalFailed: data.totalFailed,
      });

      log(`\nVessels Retrieved:`, colors.yellow);
      data.vessels.forEach((v, i) => {
        console.log(`${i + 1}. ${v.name} (${v.type}) - IMO: ${v.imo}`);
      });

      log(`\nMap Data:`, colors.yellow);
      console.log({
        totalMarkers: data.map.markers.length,
        vesselsWithLocation: data.map.vesselsWithLocation,
        bounds: data.map.bounds,
      });
    } else {
      log("✗ Batch vessels endpoint failed", colors.red);
      console.log(data);
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, colors.red);
  }
}

// Test 4: Invalid IMO handling
async function testInvalidIMO() {
  log("\n🧪 TEST 4: Invalid IMO Handling", colors.blue);
  log("━".repeat(50), colors.blue);

  try {
    const response = await fetch(`${BASE_URL}/api/vessel/invalid`);
    const data = await response.json();

    if (response.status === 400 && !data.success) {
      log("✓ Invalid IMO properly handled", colors.green);
      console.log(data);
    } else {
      log("✗ Invalid IMO not properly handled", colors.red);
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, colors.red);
  }
}

// Test 5: Empty batch request
async function testEmptyBatch() {
  log("\n🧪 TEST 5: Empty Batch Request Handling", colors.blue);
  log("━".repeat(50), colors.blue);

  try {
    const response = await fetch(`${BASE_URL}/api/vessels/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imos: [] }),
    });

    const data = await response.json();

    if (response.status === 400 && !data.success) {
      log("✓ Empty batch properly handled", colors.green);
      console.log(data);
    } else {
      log("✗ Empty batch not properly handled", colors.red);
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, colors.red);
  }
}

// Run all tests
async function runAllTests() {
  log("\n🚢 LIVE SHIP VESSEL TRACKER - API TESTS", colors.blue);
  log("═".repeat(50), colors.blue);
  log(
    "Make sure your server is running on http://localhost:5000\n",
    colors.yellow
  );

  await testRoot();
  await testSingleVessel();
  await testBatchVessels();
  await testInvalidIMO();
  await testEmptyBatch();

  log("\n" + "═".repeat(50), colors.blue);
  log("✓ All tests completed!", colors.green);
  log("═".repeat(50) + "\n", colors.blue);
}

// Execute tests
runAllTests().catch((error) => {
  log(`\n✗ Test suite failed: ${error.message}`, colors.red);
});
