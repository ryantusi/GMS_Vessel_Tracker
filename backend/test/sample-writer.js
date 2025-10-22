import fs from "fs";
import path from "path";
import { getBatchData } from "../test.js";
import imos from "./vessels.js";

// Function to write AIS destinations to a CSV file
function writeDestinationsToCSV(data, fileName = "ais_destinations.csv") {
  // Extract only ais_destination
  const destinations = data.map((item) => item.ais_destination || "unknown");

  // Add header
  const csvContent = ["ais_destination", ...destinations].join("\n");

  // Write to file
  const filePath = path.resolve(fileName);
  fs.writeFileSync(filePath, csvContent, "utf8");

  console.log(`✅ CSV file written successfully: ${filePath}`);
}

async function main() {
  const imoList = imos; // Example IMO list
  const data = await getBatchData(imoList);

  // Write only ais_destination to CSV
  writeDestinationsToCSV(data);
}

main();

