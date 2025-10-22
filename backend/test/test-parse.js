import fs from "fs";
import Fuse from "fuse.js";
import { getFullData, getVesselData, getBatchData } from "../test.js";

const data = await getVesselData(9668037);

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

// console.log(testTypes.map((t) => ({ raw: t, parsed: normalizeShipType(t) })));
// console.log(`IMO: ${data.imo}\nType: ${data.type}\nParsed: ` + normalizeShipType(data.type));

// SHIP DESTINATION NORMALIZATION

// Normalize destination port using UN/LOCODE data with fuzzy matching

// Load UN/LOCODE data
const locodeData = JSON.parse(fs.readFileSync("./helper/locode.json", "utf-8"));

// ---- Helpers ----
function cleanString(str) {
  return str
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isNoise(str) {
  const noise = ["TBA", "ORDER", "FOR ORDER", "UNKNOWN", "N/A", "NONE"];
  return noise.includes(str);
}

function normalizeLocode(str) {
  // normalize locode like "ES LPG" → "ESLPG"
  return str.replace(/\s+/g, "").toUpperCase();
}

// Build Fuse index for fuzzy matching (global)
const fuse = new Fuse(locodeData, {
  keys: ["port_norm"],
  threshold: 0.35, // a bit looser for partial matches
  includeScore: true,
});

// ---- Main function ----
function normalizeDestination(rawDest) {
  if (!rawDest || typeof rawDest !== "string") {
    return { port: "unknown", country: "unknown" };
  }

  // Step 5: Noise / special cases
  if (isNoise(rawDest)) {
    return { port: "unknown", country: "unknown" };
  }

  let dest = cleanString(rawDest);

  // Step 2a: Exact UN/LOCODE match (normalized)
  if (dest.length === 5) {
    const exact = locodeData.find((d) => d.locode === dest);
    if (exact) {
      return { port: exact.port, country: exact.country };
    }
  }

  // Step 2b: LOCODE with space (e.g. "ES LPG")
  if (dest.length === 6 && dest.includes(" ")) {
    const norm = normalizeLocode(dest);
    const exact = locodeData.find((d) => d.locode === norm);
    if (exact) {
      return { port: exact.port, country: exact.country };
    }
  }

  // Step 3: Fuzzy port match
  let fuzzyResult = fuse.search(dest, { limit: 1 });
  if (fuzzyResult.length > 0) {
    const { item, score } = fuzzyResult[0];

    // Allow substring match (e.g. "PORT SAID" vs "PORT SAID EGYPT")
    if (score <= 0.35 || item.port_norm.includes(dest)) {
      return { port: item.port, country: item.country };
    }
  }

  // Step 4: Country extraction
  for (const row of locodeData) {
    const countryUpper = row.country.toUpperCase();
    if (dest.includes(countryUpper)) {
      const fuseCountry = new Fuse(
        locodeData.filter((d) => d.country === row.country),
        { keys: ["port_norm"], threshold: 0.35, includeScore: true }
      );
      const subMatch = fuseCountry.search(dest, { limit: 1 });
      if (subMatch.length > 0) {
        const { item } = subMatch[0];
        return { port: item.port, country: item.country };
      }
    }
  }

  // If nothing matched → unknown
  return { port: "unknown", country: "unknown" };
}

// ---- Example tests ----
const testDestinations = [
  "TRTUZ",
  "KRINC",
  "AE FJR",
  "BR PNG",
  "CA-VAN",
  "PORT SAID",
  "MONTEVIDEO UYMVD",
  "ARATU. BRAZIL",
  "LAGOS NIGERIA",
  "DAMPIER, AUSTRALIA",
  "PORTLAND-USA",
  "INDIA, KOCHI",
  "BEZEE <> GBHUL",
  "LYBEN>>MTMAR",
  "MXDBT --> USPOA",
  "SGSIN=>BRPMA",
  '"===BS FPO',
  "JPMIZ TO CNZOS",
  "TBA",
  "FOR ORDER",
  "GIBRALTAR EAST ANCH",
  "FUJAIRAH BUNKERING",
  "GALLE- FOR ORDER",
  "RONDO FOR ORDERS",
  "AEFJR FOR ORDERS",
  "BRAZIL FOR ORDERS",
  "TG LFW FOR ORDER",
  "SG SIN(PEBGA)",
  "ALGECIRAS OPL",
  "UNKNOWN",
  "N/A",
  "ES LPG",
  "MAA",
  "SRIRACAHA",
  "UMM,QASR",
];

for (const d of testDestinations) {
  console.log(d, "=>", normalizeDestination(d));
}

export { normalizeShipType, normalizeDestination };
