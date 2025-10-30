// test-multi.js
import fetch from "node-fetch";
import "dotenv/config";

// Time 
const time = new Date();

// Rotate common user agents (mimic real browsers)
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17 Safari/605.1.15",
];

function getRandomUA() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.ok) {
        return response.json();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      if (attempt === retries) {
        throw error; 
      } // exponential backoff
      await new Promise((res) => setTimeout(res, delay * attempt));
    }
  }
}

// Get's Raw Data from AISFriends API
async function getFullData(imo) {
  const url = `https://www.aisfriends.com/vessel/position/imo:${imo}`;

  // encapsulated complex headers
  const headers = {
    "User-Agent": getRandomUA(),
    Accept: "application/json,text/plain,*/*",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://www.aisfriends.com/",
    Connection: "keep-alive",
    "Accept-Encoding": "gzip, deflate, br",
  };
  // !!! --- END FIX --- !!!

  try {
    const data = await fetchWithRetry(url, { headers }, 4, 1200);

    if (!data || !data.imo) {
      console.log(`[No Data Returned for IMO: ${imo}] + ${time.toLocaleTimeString()}`);
      return { imo, error: "No data" };
    }
    console.log(`[Data Retrieved for IMO: ${imo}] + ${time.toLocaleTimeString()}`);
    return data;
  } catch (error) {
    console.error(`[Data Fetch Error for ${imo}] Details: ${error.message}`);
    return { imo, error: error.message };
  }
}

// Extracts and normalizes needed key vessel data
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

// Run in batches of 20 to avoid rate limits
async function getBatchData(imoList) {
  const batchSize = 20;
  const results = [];

  for (let i = 0; i < imoList.length; i += batchSize) {
    const batch = imoList.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map((imo) => getVesselData(imo))
    );

    results.push(...batchResults);
  }

  console.log(`Batch Data Retrieval Complete ${time.toLocaleTimeString()} for IMOs: [${imoList.join(", ")}]`);
  return results;
}

export { getFullData, getVesselData, getBatchData };
