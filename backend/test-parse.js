import { getFullData, getVesselData, getBatchData } from "./test.js";

const data = await getVesselData(9668037);

function normalizeShipType(rawType) {
  if (!rawType) return "others";

  const type = rawType.toLowerCase();

  // Tanker types (mt)
  const tankerKeywords = [
    "tanker", "oil", "crude", "chemical", "asphalt",
    "acid", "molasses", "product", "lng", "lpg", "gas"
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
    "cargo", "bulk", "container", "reefer", "vehicle", "cruise",
    "livestock", "passenger", "cruise", "ro/ro", "training", "general", 
  ];
  if (mvKeywords.some((kw) => type.includes(kw))) {
    return "mv";
  }

  // If nothing matches → others
  return "others";
}

// Example test cases
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
  "Yatch"
];

// console.log(testTypes.map((t) => ({ raw: t, parsed: normalizeShipType(t) })));
// console.log(`IMO: ${data.imo}\nType: ${data.type}\nParsed: ` + normalizeShipType(data.type));

export { normalizeShipType };
