# 🚢 Backend - Express API Server

> High-performance Express.js backend with Redis caching for maritime vessel tracking

[Back to Main Project](../README.md)

---

## 📖 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Components Deep Dive](#components-deep-dive)
- [Configuration](#configuration)
- [Deployment](#deployment)

---

## 🌟 Overview

The Express backend serves as the main API layer for the Live Ship Vessel Tracker system. It orchestrates data flow between the AIS Friends API, Flask AI-Model backend, Redis cache, and the React frontend. This server handles vessel data retrieval, normalization, caching, and map data generation.

### Core Responsibilities

1. **API Gateway** - Routes requests between frontend and external services
2. **Data Orchestration** - Fetches, normalizes, and enriches vessel data
3. **Caching Layer** - Redis-powered caching with 7-day TTL (80-90% hit rate)
4. **Map Data Generation** - Creates Mapbox-compatible marker and bounds data
5. **Batch Processing** - Handles up to 20 vessels simultaneously

---

## ✨ Key Features

### 🚀 Performance Optimizations

- **Redis Caching System**
  - 7-day TTL (Time To Live)
  - 80-90% cache hit rate
  - Sub-50ms response times for cached data
  - Automatic cache invalidation
  - Graceful degradation if Redis fails

- **Intelligent Data Fetching**
  - Parallel API calls for batch requests
  - Exponential backoff retry logic
  - User-agent rotation to avoid rate limits
  - Rate limit protection (batches of 20)

### 🔧 Data Processing

- **Vessel Data Normalization**
  - Name capitalization
  - Ship type categorization (mt, mv, tug, others)
  - AIS destination decoding via Flask backend
  - Coordinate validation and formatting

- **Map Data Generation**
  - Vessel location markers
  - Destination port markers
  - Auto-calculated bounds with padding
  - Center point calculation
  - GeoJSON-compatible output

### 📊 API Features

- **Single Vessel Lookup** - Detailed vessel info with map data
- **Batch Vessel Lookup** - Up to 20 vessels in one request
- **Cache Management** - Stats, invalidation, and monitoring
- **Error Handling** - Graceful error responses with details
- **CORS Support** - Configurable allowed origins

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    REACT FRONTEND                       │
│              (Axios API Client)                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   EXPRESS BACKEND      │
        │   (Main API Server)    │
        └────────┬───────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌────────┐
│ Redis  │  │ Flask  │  │  AIS   │
│ Cache  │  │ API    │  │Friends │
│ Layer  │  │(Decode)│  │  API   │
└────────┘  └────────┘  └────────┘
```

### Request Flow

#### Single Vessel Request
```
1. Frontend → GET /api/vessel/9626390
2. Express checks Redis cache
   ├─→ Cache HIT (80-90%): Return immediately (50ms)
   └─→ Cache MISS: Continue to Step 3
3. Express → AIS Friends API (raw vessel data)
4. Express → normalizer.js
   ├─→ Normalize name & type
   └─→ Flask API (decode destination)
5. Express → mapbox.js (generate map data)
6. Express → Redis (store with 7-day TTL)
7. Express → Frontend (vessel + map data)
```

#### Batch Vessel Request
```
1. Frontend → POST /api/vessels/batch {imos: [...]}
2. Express → Redis.getBatch()
   ├─→ Cached: [9626390] (1/3)
   └─→ Missing: [9377418, 7349106] (2/3)
3. Express → AIS API (parallel fetch for missing)
4. Express → normalizer.js (batch normalize)
5. Express → Flask API (batch decode destinations)
6. Express → mapbox.js (generate batch map)
7. Express → Redis (cache new vessels)
8. Express → Frontend (combined results)
```

---

## 🛠️ Technology Stack

### Core Framework
- **Node.js 18+** - JavaScript runtime
- **Express.js 4.18** - Web application framework
- **ES Modules** - Modern JavaScript syntax

### Data & Caching
- **Redis 4.6** - In-memory data store
  - Persistent caching
  - 7-day TTL
  - Automatic reconnection
- **node-fetch 3.3** - HTTP client for API calls

### External Services
- **AIS Friends API** - Real-time vessel data source
- **Flask AI-Model** - Destination decoder and AI chatbot
- **Mapbox** - Map data and geocoding

### Development
- **dotenv** - Environment variable management
- **CORS** - Cross-Origin Resource Sharing
- **Jest** - Testing framework (optional)

---

## 📁 Project Structure

```
backend/
├── utils/                        # Utility Modules
│   ├── apiData.js               # AIS API data fetching
│   │   ├── getRandomUA()        # User-agent rotation
│   │   ├── fetchWithRetry()     # Retry with backoff
│   │   ├── getFullData()        # Fetch raw vessel data
│   │   ├── getVesselData()      # Extract key vessel data
│   │   └── getBatchData()       # Batch vessel fetching
│   │
│   ├── normalizer.js            # Data normalization
│   │   ├── normalizeName()      # Capitalize vessel names
│   │   ├── normalizeShipType()  # Categorize ship types
│   │   ├── normalizeDestination() # Decode via Flask API
│   │   └── normalizeData()      # Complete normalization
│   │
│   ├── mapbox.js                # Map data generation
│   │   ├── createSingleVesselMap() # Single vessel + destination
│   │   ├── createBatchVesselMap()  # Multiple vessels
│   │   ├── calculateBounds()    # Auto-fit bounds
│   │   ├── calculateCenter()    # Center point
│   │   └── markersToGeoJSON()   # GeoJSON conversion
│   │
│   └── cache.js                 # Redis caching service
│       ├── connectRedis()       # Initialize connection
│       ├── getVessel()          # Get cached vessel
│       ├── setVessel()          # Cache vessel (7-day TTL)
│       ├── getBatch()           # Batch cache lookup
│       ├── setBatch()           # Batch cache storage
│       ├── deleteVessel()       # Manual invalidation
│       ├── clearAll()           # Clear all cache
│       ├── getStats()           # Cache statistics
│       └── isConnected()        # Connection status
│
├── server.js                    # Express application & routes
│   ├── GET /                    # Health check
│   ├── GET /api/vessel/:imo     # Single vessel lookup
│   ├── POST /api/vessels/batch  # Batch vessel lookup
│   ├── GET /api/cache/stats     # Cache statistics
│   └── DELETE /api/cache/vessel/:imo # Clear specific cache
│
├── package.json                 # Node dependencies
├── package-lock.json            # Dependency lock file
├── .env                         # Environment variables
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
└── test-api.js                  # API testing script (optional)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+**
  ```bash
  node --version  # Should be >= 18.0.0
  ```

- **npm** (comes with Node.js)
  ```bash
  npm --version
  ```

- **Redis Server**
  ```bash
  redis-server --version  # Should be >= 6.0
  ```

- **Flask AI-Model Backend** (must be running)
  ```bash
  # See AI-Model/README.md for setup
  ```

### Installation

#### 1️⃣ Navigate to Backend Directory

```bash
cd backend
```

#### 2️⃣ Install Dependencies

```bash
npm install
```

**Dependencies installed:**
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "node-fetch": "^3.3.2",
  "redis": "^4.6.7"
}
```

#### 3️⃣ Set Up Environment Variables

```bash
# Create .env file
cp .env.example .env  # Or create manually
```

**Edit `.env` file:**
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Flask AI-Model Backend URLs
DESTINATION_DECODER_API=http://127.0.0.1:10000/api/destination
AI_CHATBOT_API=http://127.0.0.1:10000/api/chat

# Redis Configuration
REDIS_URL=redis://localhost:6379

# CORS Settings (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Mapbox (optional - used by mapbox.js)
MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
MAPBOX_STYLE=mapbox://styles/mapbox/dark-v11
```

**Get Mapbox Token:**
1. Go to https://account.mapbox.com/
2. Create account (free tier available)
3. Copy your default public token
4. Paste into `.env`

#### 4️⃣ Start Redis Server

```bash
# On Windows (if installed via MSI):
redis-server

# On Mac (with Homebrew):
brew services start redis

# On Linux:
sudo systemctl start redis-server

# Or using Docker:
docker run -d --name redis -p 6379:6379 redis:latest
```

**Verify Redis is running:**
```bash
redis-cli ping
# Should return: PONG
```

#### 5️⃣ Ensure Flask Backend is Running

```bash
# In a separate terminal, navigate to AI-Model directory
cd ../AI-Model

# Activate virtual environment
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Start Flask server
python app.py

# Should see: "Running on http://127.0.0.1:10000"
```

### Running the Server

#### Development Mode

```bash
npm start
```

**Expected output:**
```
✅ Redis connected successfully
🚢 Ship Tracker API running on port 5000
📍 Single vessel: GET http://localhost:5000/api/vessel/:imo
📍 Batch vessels: POST http://localhost:5000/api/vessels/batch
💾 Redis cache: ENABLED
```

#### Production Mode (with PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start server with PM2
pm2 start server.js --name vessel-tracker-api

# View logs
pm2 logs vessel-tracker-api

# Stop server
pm2 stop vessel-tracker-api
```

### Verify Installation

#### Test Health Check
```bash
curl http://localhost:5000/
```

**Expected response:**
```json
{
  "message": "Live Ship Vessel Tracker API",
  "version": "1.0.0",
  "cache": "enabled",
  "endpoints": {
    "single": "/api/vessel/:imo",
    "batch": "/api/vessels/batch",
    "cacheStats": "/api/cache/stats",
    "clearCache": "DELETE /api/cache/vessel/:imo"
  }
}
```

#### Test Single Vessel
```bash
curl http://localhost:5000/api/vessel/9626390
```

#### Test Cache Stats
```bash
curl http://localhost:5000/api/cache/stats
```

---

## 🌐 API Endpoints

### Base URL
```
http://localhost:5000
```

### 1. Health Check
```http
GET /
```

**Response:**
```json
{
  "message": "Live Ship Vessel Tracker API",
  "version": "1.0.0",
  "cache": "enabled",
  "endpoints": {...}
}
```

---

### 2. Single Vessel Lookup
```http
GET /api/vessel/:imo
```

**Parameters:**
- `imo` (path) - IMO number (7-10 digits)

**Example Request:**
```bash
curl http://localhost:5000/api/vessel/9626390
```

**Success Response (200):**
```json
{
  "success": true,
  "vessel": {
    "imo": "9626390",
    "name": "Ruby",
    "type": "mt",
    "ais_destination": {
      "destination": "Istanbul, Turkey",
      "port": "Istanbul",
      "country": "Turkey",
      "lat": 41.0082,
      "lon": 28.9784
    },
    "reportedDestination": "TR IST",
    "latitude": 41.125858,
    "longitude": 29.078135,
    "navigational_status": "Underway using engine",
    "speed_over_ground": 10.0,
    "course_over_ground": 245.0
  },
  "map": {
    "markers": [
      {
        "type": "vessel",
        "coordinates": [29.078135, 41.125858],
        "properties": {
          "imo": "9626390",
          "name": "Ruby",
          "type": "mt",
          "destination": "Istanbul, Turkey"
        }
      },
      {
        "type": "port",
        "coordinates": [28.9784, 41.0082],
        "properties": {
          "name": "Istanbul, Turkey",
          "portFor": "Ruby"
        }
      }
    ],
    "bounds": [[28.8784, 40.9082], [29.1781, 41.2259]],
    "center": [29.078135, 41.125858],
    "zoom": null
  },
  "cached": false,
  "cachedAt": "2025-10-31T10:30:00.000Z"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "error": "No data",
  "imo": "9999999"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid IMO number provided"
}
```

---

### 3. Batch Vessel Lookup
```http
POST /api/vessels/batch
Content-Type: application/json
```

**Request Body:**
```json
{
  "imos": ["9626390", "9377418", "7349106"]
}
```

**Example Request:**
```bash
curl -X POST http://localhost:5000/api/vessels/batch \
  -H "Content-Type: application/json" \
  -d '{"imos": ["9626390", "9377418", "7349106"]}'
```

**Success Response (200):**
```json
{
  "success": true,
  "totalRequested": 3,
  "totalSuccess": 3,
  "totalFailed": 0,
  "cachedCount": 1,
  "fetchedCount": 2,
  "vessels": [
    {
      "imo": "9626390",
      "name": "Ruby",
      "type": "mt",
      "ais_destination": {...},
      "latitude": 41.125858,
      "longitude": 29.078135
    },
    {...},
    {...}
  ],
  "map": {
    "markers": [...],
    "bounds": [...],
    "center": [...],
    "zoom": null,
    "totalVessels": 3,
    "vesselsWithLocation": 3
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "error": "Invalid request. Please provide an array of IMO numbers."
}
```

---

### 4. Cache Statistics
```http
GET /api/cache/stats
```

**Response:**
```json
{
  "success": true,
  "cacheEnabled": true,
  "totalVessels": 15,
  "serverInfo": "..."
}
```

---

### 5. Clear Specific Cache
```http
DELETE /api/cache/vessel/:imo
```

**Example:**
```bash
curl -X DELETE http://localhost:5000/api/cache/vessel/9626390
```

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared for IMO 9626390"
}
```

---

## 🔧 Components Deep Dive

### 1. API Data Fetcher (`utils/apiData.js`)

Handles all communication with the AIS Friends API.

#### User-Agent Rotation
```javascript
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/129",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15"
];

function getRandomUA() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}
```

#### Retry with Exponential Backoff
```javascript
async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response.json();
      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise(res => setTimeout(res, delay * attempt));
    }
  }
}
```

#### Batch Processing
```javascript
async function getBatchData(imoList) {
  const batchSize = 20;  // Prevent rate limiting
  const results = [];
  
  for (let i = 0; i < imoList.length; i += batchSize) {
    const batch = imoList.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(imo => getVesselData(imo))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

---

### 2. Data Normalizer (`utils/normalizer.js`)

Transforms raw API data into consistent, clean format.

#### Name Normalization
```javascript
function normalizeName(str) {
  if (typeof str !== "string" || str.length === 0) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// "RUBY" → "Ruby"
// "container ship" → "Container ship"
```

#### Ship Type Classification
```javascript
function normalizeShipType(rawType) {
  if (!rawType) return "others";
  const type = rawType.toLowerCase();
  
  // Tankers (mt) - Oil, Chemical, LNG/LPG, Gas
  const tankerKeywords = ["tanker", "oil", "crude", "chemical", "lng", "lpg", "gas"];
  if (tankerKeywords.some(kw => type.includes(kw))) return "mt";
  
  // Tugs
  const tugKeywords = ["tug", "pusher", "tractor"];
  if (tugKeywords.some(kw => type.includes(kw))) return "tug";
  
  // Merchant vessels (mv) - Cargo, Container, Passenger
  const mvKeywords = ["cargo", "bulk", "container", "reefer", "passenger", "ro/ro"];
  if (mvKeywords.some(kw => type.includes(kw))) return "mv";
  
  return "others";
}

// "Oil Tanker" → "mt"
// "Container Ship" → "mv"
// "Tractor Tug" → "tug"
```

#### Destination Decoding
```javascript
async function normalizeDestination(rawDest) {
  const DEST_API = process.env.DESTINATION_DECODER_API;
  const dest = rawDest.trim().toUpperCase();
  
  const response = await fetch(DEST_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destination: dest })
  });
  
  return response.json();
}

// "TR IST" → {port: "Istanbul", country: "Turkey", lat: 41.0082, lon: 28.9784}
// "SGSIN" → {port: "Singapore", country: "Singapore", ...}
```

---

### 3. Redis Cache Service (`utils/cache.js`)

Manages caching with 7-day TTL for performance optimization.

#### Connection Management
```javascript
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) return new Error("Redis reconnection failed");
      return Math.min(retries * 100, 3000);  // Exponential backoff
    }
  }
});
```

#### Cache Operations
```javascript
// Get cached vessel
async getVessel(imo) {
  const key = `vessel:${imo}`;
  const cachedData = await redisClient.get(key);
  
  if (cachedData) {
    console.log(`📦 Cache HIT for IMO ${imo}`);
    return JSON.parse(cachedData);
  }
  
  console.log(`❌ Cache MISS for IMO ${imo}`);
  return null;
}

// Store vessel with 7-day TTL
async setVessel(imo, data) {
  const key = `vessel:${imo}`;
  const ttl = 7 * 24 * 60 * 60;  // 7 days in seconds
  
  await redisClient.setEx(key, ttl, JSON.stringify(data));
  console.log(`💾 Cached IMO ${imo} (expires in 7 days)`);
}
```

#### Batch Caching
```javascript
async getBatch(imos) {
  const results = { cached: {}, missing: [] };
  
  const promises = imos.map(imo => this.getVessel(imo));
  const cachedData = await Promise.all(promises);
  
  cachedData.forEach((data, index) => {
    const imo = imos[index];
    if (data) {
      results.cached[imo] = data;
    } else {
      results.missing.push(imo);
    }
  });
  
  console.log(`📊 Batch: ${Object.keys(results.cached).length} hits, ${results.missing.length} misses`);
  return results;
}
```

---

### 4. Map Data Generator (`utils/mapbox.js`)

Creates Mapbox-compatible map configurations.

#### Single Vessel Map
```javascript
export function createSingleVesselMap(vesselData) {
  const markers = [];
  
  // Add vessel marker
  if (vesselData.latitude && vesselData.longitude) {
    markers.push({
      type: "vessel",
      coordinates: [vesselData.longitude, vesselData.latitude],
      properties: {
        imo: vesselData.imo,
        name: vesselData.name,
        type: vesselData.type,
        destination: vesselData.ais_destination.destination
      }
    });
  }
  
  // Add destination port marker
  if (vesselData.ais_destination?.lat && vesselData.ais_destination?.lon) {
    markers.push({
      type: "port",
      coordinates: [vesselData.ais_destination.lon, vesselData.ais_destination.lat],
      properties: {
        name: vesselData.ais_destination.destination,
        portFor: vesselData.name
      }
    });
  }
  
  return {
    markers,
    bounds: calculateBounds(markers),
    center: markers[0]?.coordinates || [0, 0],
    zoom: markers.length === 1 ? 8 : null
  };
}
```

#### Bounds Calculation
```javascript
function calculateBounds(markers) {
  if (markers.length === 0) return null;
  
  let minLng = Infinity, maxLng = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;
  
  markers.forEach(marker => {
    const [lng, lat] = marker.coordinates;
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });
  
  // Add 5% padding
  const lngPadding = (maxLng - minLng) * 0.05;
  const latPadding = (maxLat - minLat) * 0.05;
  
  return [
    [minLng - lngPadding, minLat - latPadding],
    [maxLng + lngPadding, maxLat + latPadding]
  ];
}
```

---

## ⚙️ Configuration

### Environment Variables

Complete `.env` configuration:

```env
# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=5000
NODE_ENV=development

# ============================================
# FLASK AI-MODEL BACKEND
# ============================================
# Destination decoder endpoint
DESTINATION_DECODER_API=http://127.0.0.1:10000/api/destination

# AI chatbot endpoint
AI_CHATBOT_API=http://127.0.0.1:10000/api/chat

# ============================================
# REDIS CACHE
# ============================================
# Local Redis
REDIS_URL=redis://localhost:6379

# Redis Cloud (production example)
# REDIS_URL=redis://username:password@redis-host:port

# ============================================
# CORS SETTINGS
# ============================================
# Comma-separated list of allowed origins
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Production example:
# ALLOWED_ORIGINS=https://vesseltracker.netlify.app,http://localhost:5173

# ============================================
# MAPBOX (OPTIONAL)
# ============================================
MAPBOX_ACCESS_TOKEN=your_mapbox_token
MAPBOX_STYLE=mapbox://styles/mapbox/dark-v11
```

### CORS Configuration

```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:5173"];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error("CORS policy violation"), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
```

### Redis Configuration

```javascript
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error("Redis: Too many reconnection attempts");
        return new Error("Redis reconnection failed");
      }
      return Math.min(retries * 100, 3000);  // Max 3 seconds
    }
  }
});
```

---

## 🚀 Deployment

### Deployment to Render

#### 1️⃣ Prepare for Deployment

Ensure `package.json` has start script:
```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

#### 2️⃣ Create Render Web Service

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - **Name**: `vessel-tracker-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

#### 3️⃣ Set Environment Variables

In Render dashboard, add:
```
PORT=5000
NODE_ENV=production
DESTINATION_DECODER_API=https://your-flask-backend.onrender.com/api/destination
AI_CHATBOT_API=https://your-flask-backend.onrender.com/api/chat
REDIS_URL=your_redis_cloud_url
ALLOWED_ORIGINS=https://your-frontend.netlify.app
```

**Get Redis Cloud URL:**
1. Create account at https://redis.com/try-free/
2. Create database
3. Copy connection URL
4. Format: `redis://username:password@host:port`

#### 4️⃣ Deploy

Click "Create Web Service"

**Deployment URL:**
```
https://vessel-tracker-backend.onrender.com
```

#### 5️⃣ Update Frontend

In frontend `.env`:
```env
VITE_API_URL=https://vessel-tracker-backend.onrender.com
```

### Health Check

After deployment, verify:
```bash
curl https://vessel-tracker-backend.onrender.com/
```

---

## 📚 Additional Resources

### Express.js Documentation
- **Official Docs**: https://expressjs.com/
- **Routing Guide**: https://expressjs.com/en/guide/routing.html
- **Middleware**: https://expressjs.com/en/guide/using-middleware.html

### Redis Documentation
- **Redis Node Client**: https://github.com/redis/node-redis
- **Redis Cloud**: https://redis.com/redis-enterprise-cloud/overview/
- **Caching Strategies**: https://redis.io/docs/manual/patterns/

### AIS Data
- **AIS Friends**: https://www.aisfriends.com/
- **Maritime Mobile Service Identity**: https://en.wikipedia.org/wiki/Maritime_Mobile_Service_Identity

---

<div align="center">

**Part of the Live Ship Vessel Tracker System**

[Main Project](../README.md) | [AI-Model](../AI-Model/README.md) | [Frontend](../frontend/README.md)

⚡ Built for performance with Redis caching and intelligent data processing. ~ Ryan Tusi, Full Stack + AI/ML Engineer

</div>