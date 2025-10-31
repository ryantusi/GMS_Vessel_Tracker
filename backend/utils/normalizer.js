import fetch from "node-fetch";
import "dotenv/config";

// Import API data functions for testing
import { getFullData, getVesselData, getBatchData } from "./apiData.js";

// NAME NORMALIZATION
function normalizeName(str) {
  if (typeof str !== "string" || str.length === 0) {
    return "";
  }
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// SHIP TYPE NORMALIZATION

// Normalize ship type into categories: mt, mv, tug, others
function normalizeShipType(rawType) {
  if (!rawType) return "others";

  const type = rawType.toLowerCase();

  // Tanker types (mt)
  const tankerKeywords = [
    "tanker",
    "oil",
    "crude",
    "chemical",
    "asphalt",
    "acid",
    "molasses",
    "product",
    "lng",
    "lpg",
    "gas",
  ];
  if (tankerKeywords.some((kw) => type.includes(kw))) {
    return "mt";
  }

  // Tug types
  const tugKeywords = ["tug", "pusher", "tractor", "catamaran", "yatch"];
  if (tugKeywords.some((kw) => type.includes(kw))) {
    return "tug";
  }

  // Merchant vessels (mv) → cargo, container, passenger, ro/ro, etc.
  const mvKeywords = [
    "cargo",
    "bulk",
    "container",
    "reefer",
    "vehicle",
    "cruise",
    "livestock",
    "passenger",
    "cruise",
    "ro/ro",
    "training",
    "general",
  ];
  if (mvKeywords.some((kw) => type.includes(kw))) {
    return "mv";
  }

  // If nothing matches → others
  return "others";
}

// Example test cases for ship type normalization
const testTypes = [
  "Cargo",
  "Bulk Carrier",
  "Oil Tanker",
  "Chemical Tanker",
  "Container",
  "Passenger",
  "Tug",
  "Tractor Tug",
  "Unknown",
  "Yatch",
];

// Testing
// console.log(testTypes.map((t) => ({ raw: t, parsed: normalizeShipType(t) })));
// console.log(`IMO: ${data.imo}\nType: ${data.type}\nParsed: ` + normalizeShipType(data.type));

// SHIP DESTINATION NORMALIZATION

// Normalize destination port by calling the deployed Flask backend
async function normalizeDestination(rawDest) {
  // CRITICAL: Ensure the DEST_API environment variable is accessible
  const DEST_API = process.env.DESTINATION_DECODER_API;
  if (!DEST_API) {
    console.error("FATAL: DESTINATION_DECODER_API is not set in environment.");
    return { error: "API not configured" };
  }

  // FIX: Handle null, undefined, or non-string values
  if (!rawDest || typeof rawDest !== "string") {
    console.warn(
      `Invalid destination value: ${rawDest} (type: ${typeof rawDest})`
    );
    return {
      matched: false,
      reportedDestination: rawDest?.toString() || "Unknown",
      error: "Invalid destination format",
    };
  }

  const dest = rawDest.trim().toUpperCase();

  // Handle empty string after trim
  if (!dest) {
    return {
      matched: false,
      reportedDestination: "Unknown",
      error: "Empty destination",
    };
  }

  try {
    const response = await fetch(DEST_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // FIX: The body MUST be stringified JSON
      body: JSON.stringify({
        destination: dest,
      }),
    });

    if (response.ok) {
      // The Flask endpoint returns JSON, so we parse it here.
      return response.json();
    } else {
      // Log the error details from the server response
      const errorText = await response.text();
      console.error(`Backend HTTP Error (${response.status}): ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (e) {
    console.error(`Error normalizing destination '${rawDest}':`, e.message);
    return { error: "Normalization failed" };
  }
}

// ---- Example tests ----
const testDestinations = [
  "TRTUZ",
  "KRINC",
  "AE FJR",
  "BEZEE <> GBHUL",
  "LYBEN>>MTMAR",
  "SGSIN=>BRPMA",
  "PORT SAID",
  "TBA",
  "GIBRALTAR EAST ANCH",
  "UNKNOWN",
  "MAA",
];

// Wrap the testing loop in an async IIFE (Immediately Invoked Function Expression)
// to use await safely in the module context.
// (async () => {
//     console.log("--- Destination Normalization Tests ---");
//     for (const d of testDestinations) {
//         // FIX: Await the asynchronous function call
//         const result = await normalizeDestination(d);
//         console.log(`Input: ${d.padEnd(25)} => \nResult: ${JSON.stringify(result)}`);
//     }
// })();

// FULL NORMALIZATION
async function normalizeData(rawData) {
  // 1. Fetch Raw Data from API
  const vesselData = rawData;

  // 2. Normalize Name & Ship Type
  vesselData.name = normalizeName(vesselData.name);
  vesselData.type = normalizeShipType(vesselData.type);

  // 3. Normalize Destination
  const destData = await normalizeDestination(vesselData.ais_destination);
  if (destData["matched"]) {
    vesselData.ais_destination = {
      destination: `${destData["port"]}, ${destData["country"]}`,
      port: destData["port"],
      country: destData["country"],
      lat: destData["lat"],
      lon: destData["lon"],
    };
  } else {
    vesselData.ais_destination = "Unknown";
  }
  vesselData.reportedDestination = destData["reportedDestination"];

  return vesselData;
}

// // Fully Function Test
// async function Test(imo) {
//   console.log("--- Testing ---");
//   console.log(`Fetching ${imo} vessel data...`);

//   // 1. Fetch Raw Data from API
//   const vesselData = await getVesselData(imo);

//   // 2. Print Raw Data
//   console.log("FETCHED DATA!");
//   console.log(vesselData);

//   // 3. Normalize Data
//   console.log("NORMALIZING DATA...");

//   // 4. Normalize Name & Ship Type
//   vesselData.name = normalizeName(vesselData.name);
//   vesselData.type = normalizeShipType(vesselData.type);

//   // 5. Normalize Destination
//   const destData = await normalizeDestination(vesselData.ais_destination);
//   if(destData["matched"]) {
//     vesselData.ais_destination = {
//       destination: `${destData["port"]}, ${destData["country"]}`,
//       lat: destData["lat"],
//       lon: destData["lon"]
//     };
//   } else {
//     vesselData.ais_destination = "Unknown"
//   }
//   vesselData.reportedDestination = destData["reportedDestination"];

//   // 6. Print Final Data
//   console.log("FINAL DATA:");
//   console.log(vesselData);
// }

// Test(9626390);

export {
  normalizeName,
  normalizeShipType,
  normalizeDestination,
  normalizeData,
};
