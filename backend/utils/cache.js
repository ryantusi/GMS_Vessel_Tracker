import { createClient } from "redis";

// Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error("Redis: Too many reconnection attempts");
        return new Error("Redis reconnection failed");
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

// Error handling
redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

redisClient.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

// Connect to Redis
let isConnected = false;

async function connectRedis() {
  if (!isConnected) {
    try {
      await redisClient.connect();
      isConnected = true;
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      throw error;
    }
  }
}

// Initialize connection
connectRedis();

/**
 * Cache service with auto-expiry
 */
const cacheService = {
  /**
   * Get cached vessel data
   * @param {string} imo - IMO number
   * @returns {Promise<Object|null>} Cached data or null
   */
  async getVessel(imo) {
    try {
      const key = `vessel:${imo}`;
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        console.log(`📦 Cache HIT for IMO ${imo}`);
        return JSON.parse(cachedData);
      }

      console.log(`❌ Cache MISS for IMO ${imo}`);
      return null;
    } catch (error) {
      console.error("Redis GET error:", error);
      return null; // Fail gracefully - fetch from API instead
    }
  },

  /**
   * Store vessel data in cache with 7-day TTL
   * @param {string} imo - IMO number
   * @param {Object} data - Vessel data to cache
   * @returns {Promise<boolean>} Success status
   */
  async setVessel(imo, data) {
    try {
      const key = `vessel:${imo}`;
      const ttl = 7 * 24 * 60 * 60; // 7 days in seconds

      // Store with expiry
      await redisClient.setEx(key, ttl, JSON.stringify(data));

      console.log(`💾 Cached IMO ${imo} (expires in 7 days)`);
      return true;
    } catch (error) {
      console.error("Redis SET error:", error);
      return false; // Fail gracefully - data still returned to user
    }
  },

  /**
   * Get multiple vessels (for batch requests)
   * @param {Array<string>} imos - Array of IMO numbers
   * @returns {Promise<Object>} Object with cached and missing IMOs
   */
  async getBatch(imos) {
    try {
      const results = {
        cached: {},
        missing: [],
      };

      // Get all keys in parallel
      const promises = imos.map((imo) => this.getVessel(imo));
      const cachedData = await Promise.all(promises);

      // Separate cached and missing
      cachedData.forEach((data, index) => {
        const imo = imos[index];
        if (data) {
          results.cached[imo] = data;
        } else {
          results.missing.push(imo);
        }
      });

      console.log(
        `📊 Batch cache: ${Object.keys(results.cached).length} hits, ${
          results.missing.length
        } misses`
      );
      return results;
    } catch (error) {
      console.error("Redis BATCH GET error:", error);
      return { cached: {}, missing: imos }; // Fetch all from API
    }
  },

  /**
   * Store multiple vessels in cache
   * @param {Array<Object>} vessels - Array of vessel objects with imo property
   * @returns {Promise<void>}
   */
  async setBatch(vessels) {
    try {
      const promises = vessels.map((vessel) =>
        this.setVessel(vessel.imo, vessel)
      );
      await Promise.all(promises);
      console.log(`💾 Cached ${vessels.length} vessels`);
    } catch (error) {
      console.error("Redis BATCH SET error:", error);
    }
  },

  /**
   * Delete cached vessel data (manual invalidation)
   * @param {string} imo - IMO number
   * @returns {Promise<boolean>} Success status
   */
  async deleteVessel(imo) {
    try {
      const key = `vessel:${imo}`;
      await redisClient.del(key);
      console.log(`🗑️ Deleted cache for IMO ${imo}`);
      return true;
    } catch (error) {
      console.error("Redis DELETE error:", error);
      return false;
    }
  },

  /**
   * Clear all cached vessels
   * @returns {Promise<boolean>} Success status
   */
  async clearAll() {
    try {
      const keys = await redisClient.keys("vessel:*");
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log(`🗑️ Cleared ${keys.length} cached vessels`);
      }
      return true;
    } catch (error) {
      console.error("Redis CLEAR error:", error);
      return false;
    }
  },

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache stats
   */
  async getStats() {
    try {
      const keys = await redisClient.keys("vessel:*");
      const info = await redisClient.info("stats");

      return {
        totalVessels: keys.length,
        serverInfo: info,
      };
    } catch (error) {
      console.error("Redis STATS error:", error);
      return { totalVessels: 0, error: error.message };
    }
  },

  /**
   * Check if Redis is connected
   * @returns {boolean} Connection status
   */
  isConnected() {
    return isConnected && redisClient.isReady;
  },
};

export default cacheService;
