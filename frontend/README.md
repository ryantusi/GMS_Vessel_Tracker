# 🌐 Frontend - React + Vite, Tailwind, Lucide, & Mapbox GL

> A highly interactive and responsive client for real-time maritime vessel tracking and AI interaction.

[Back to Main Project](../README.md)

-----

## 📖 Table of Contents

  - [Overview](#overview)
  - [Key Features](#key-features)
  - [Architecture](#architecture)
  - [Technology Stack](#technology-stack)
  - [Project Structure](#project-structure)
  - [Core Components Deep Dive](#core-components-deep-dive)
  - [Getting Started](#getting-started)
  - [Deployment](#deployment)

-----

## 🌟 Overview

The **Live Ship Vessel Tracker Frontend** is the client-facing application built on **React** and styled with **Tailwind CSS**. It provides a fast, intuitive, and interactive user experience for accessing the real-time, cached, and intelligently-decoded vessel data delivered by the Express.js API.

### Core Responsibilities

1.  **User Interface (UI):** Provides clear forms for **Single** and **Batch** vessel searches.
2.  **Interactive Mapping:** Visualizes vessel positions and port destinations using **Mapbox GL JS** with custom styling and markers.
3.  **AI Chatbot Integration:** Hosts the floating **COMPASS AI Assistant** component, managing the chat lifecycle and communication with the Flask backend.
4.  **Data Visualization:** Renders vessel specifications, navigational data, and batch processing results in tables and detail cards.
5.  **State & Routing:** Manages application flow, loading states, and elegant error handling using React Router and custom hooks.

-----

## ✨ Key Features

### 🗺️ Visualization & Interactivity

  - **Real-Time Mapbox Integration:** Interactive global map using Mapbox GL JS, displaying custom markers for vessels (ships) and destination ports (pins).
  - **Auto-Fit Map Bounds:** Automatically zooms and pans the map to contain all vessels and their destination ports in the viewport for both single and batch searches.
  - **Custom Popups:** Informative, context-aware popups on markers showing key data (IMO, Name, Destination).
  - **Responsive Design (Tailwind CSS):** Fully optimized for mobile, tablet, and desktop viewing, ensuring seamless usability across devices.

### 🚀 Performance & UX

  - **Efficient Routing:** Utilizes **React Router DOM v6** for fast client-side navigation between Home, Single Vessel, and Batch Results pages.
  - **Dedicated Loading & Error States:** Custom `<LoadingSpinner />` and `<ErrorMessage />` components ensure clear communication of asynchronous operations and graceful failure handling.
  - **Asynchronous API Service:** A robust `api.js` module handles all complex API communication, including error mapping and connection to both Express and Flask backends.

### 🤖 AI-Powered Experience

  - **COMPASS Chatbot:** A persistent, floating chat interface that initializes the AI session, manages conversation state, and provides real-time, context-aware maritime information, powered by the Flask/Gemini backend.
  - **Intuitive Forms:** Comprehensive client-side validation for IMO numbers in both single-entry and comma-separated batch forms before API submission.

-----

## 🏗️ Architecture

The frontend is a classic Single Page Application (SPA) utilizing the unidirectional data flow inherent to React, with all state and effects managed within components and a centralized API service layer.

```
┌─────────────────────────────────────────────────────────┐
│                 REACT FRONTEND (Vite/Tailwind)          │
└───────────────────────┬───────────┬─────────────────────┘
                        │           │
                        ▼           ▼
                  ┌─────────┐  ┌───────────────┐
                  │ API.js  │  │ MapComponent  │
                  │ (Axios) │  │  (Mapbox GL)  │
                  └────┬────┘  └───────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌───────────────┐               ┌──────────────────┐
│Express Server │               │ Flask AI/Chatbot │
│ (Vessel Data) |               └──────────────────┘
└───────────────┘
```

-----

## 🛠️ Technology Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | **React 18.3.1** | Building the user interface and managing component state. |
| **Styling** | **Tailwind CSS v4** | Utility-first framework for rapid and responsive UI development. |
| **Mapping** | **Mapbox GL JS** | Interactive 2D/3D map visualization for vessel locations and routes. |
| **Routing** | **React Router DOM 6** | Declarative client-side routing. |
| **API Client** | **Axios** | Promise-based HTTP client for robust API requests. |
| **Build Tool** | **Vite** | Next-generation frontend tooling for a fast development server and optimized build. |
| **Icons** | **Lucide React** | Simple, consistent icon set for visual clarity. |

-----

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/                # Reusable UI elements
│   │   ├── Chatbot.jsx            # Floating AI assistant interface
│   │   ├── MapComponent.jsx       # Mapbox map integration & marker logic
│   │   ├── ErrorMessage.jsx       # Global error display
│   │   ├── LoadingSpinner.jsx     # Custom loading animation
│   │   └── Footer.jsx             # Site footer
│   ├── pages/                     # Top-level views (Routes)
│   │   ├── Home.jsx               # Landing page with search forms
│   │   ├── SingleVessel.jsx       # Detailed single vessel view
│   │   └── BatchVessels.jsx       # Table and summary of batch results
│   ├── services/                  # Centralized API logic
│   │   └── api.js                 # Axios instance and wrappers
│   ├── App.jsx                    # Main router and layout wrapper
│   └── index.css                  # Global styles/Tailwind directives
│    ...
├── public/                        # Static assets
└── .env                           # Environment variables
```

-----

## 🔧 Core Components Deep Dive

### 1\. `MapComponent.jsx` (Mapbox Integration)

This component is the heart of the visualization layer. It leverages React's **`useRef`** and **`useEffect`** hooks to manage the Mapbox GL JS lifecycle outside of React's render cycle, preventing memory leaks and ensuring efficient updates.

| Feature | Implementation Detail |
| :--- | :--- |
| **Initialization** | Uses `useEffect` with an empty dependency array to initialize the map only once (`map.current = new mapboxgl.Map(...)`). |
| **Data Synchronization** | A second `useEffect` hook monitors the `markers` and `bounds` props. It handles the **removal of old markers** and **creation of new custom HTML markers** with attached popups for vessels and ports. |
| **Viewport Control** | Uses `map.current.fitBounds(bounds)` with padding and smooth duration for an elegant, automatic zoom and pan to contain all requested data points. |
| **Custom Markers** | Creates distinct HTML elements for vessel and port markers, styled with Tailwind CSS for visibility and visual differentiation. |

### 2\. `api.js` (API Service Layer)

A centralized module that decouples the React components from direct network logic.

  * **Instance Creation:** Uses **Axios** with a base URL and default JSON headers for the Express backend.
  * **Dual Backend Calls:** It manages calls to **both** the Express API (for vessel data, `getSingleVessel`, `getBatchVessels`) and the separate Flask API (for AI, `initChatbot`, `sendChatMessage`).
  * **Normalized Error Handling:** Implements `try...catch` blocks to transform raw Axios errors into a consistent, application-friendly object:
    ```javascript
    // Example from getSingleVessel
    throw {
      message: error.response?.data?.error || "Failed to fetch vessel data",
      status: error.response?.status || 500,
      details: error.response?.data?.details || error.message,
    };
    ```

### 3\. `Chatbot.jsx` (COMPASS AI Assistant)

This component implements a persistent, floating chat panel that remains accessible throughout the application.

  * **State Management:** Tracks `isOpen`, `messages`, `isLoading`, and `isInitializing` to manage the UI state of the chat, including the "COMPASS is thinking..." message.
  * **Lifecycle Control:** Uses `useEffect` to automatically **initialize the chat session** (calling `/api/chat/init`) and **auto-scroll** new messages into view, ensuring a smooth conversational flow.
  * **Visual Flair:** Includes a floating pulse animation on the closed button (`!isOpen`) to subtly draw the user's attention, and custom styling for user/bot messages.

### 4\. `BatchVessels.jsx` (Batch Results)

Designed for handling and displaying the complex output of the Express backend's batch processing endpoint.

  * **Dynamic Navigation:** Receives the list of IMOs via **`useLocation().state`** from the `Home.jsx` search form.
  * **Result Summary:** Clearly visualizes the results with summary cards, showing **Total Requested**, **Successfully Found**, and **Failed / Not Found** counts.
  * **Data Table:** Renders a clean, scrollable table of successful vessel results, including the **decoded Port** and **Country** next to the original **Reported Destination**, highlighting the core value proposition.
  * **Drill-Down:** Each row includes a "View" button to navigate to the detailed `SingleVessel.jsx` page (`/vessel/:imo`), allowing users to seamlessly transition from batch results to deep detail.

-----

## 🚀 Getting Started

To run the frontend locally, you must have the **Express Backend** and **Flask AI-Model Backend** running first (see their respective READMEs).

### Prerequisites

  - **Node.js** (v18.0.0 or higher)
  - **npm** or **yarn**
  - **Mapbox Access Token** (Public token with default settings)

### Installation

#### 1️⃣ Navigate to the Frontend Directory

```bash
cd frontend
```

#### 2️⃣ Install Dependencies

```bash
npm install
# or yarn install
```

#### 3️⃣ Configure Environment Variables

Create the `.env` file for Vite to access backend URLs and Mapbox credentials.

```bash
cp .env.example .env
```

**Edit the `.env` file:**

```env
# URL for the Express Backend (API Server)
VITE_API_URL=http://localhost:5000

# URL for the Flask Backend (AI-Model / Destination Decoder)
VITE_FLASK_API_URL=http://127.0.0.1:10000

# Your Mapbox Public Access Token
VITE_MAPBOX_TOKEN=your_mapbox_token_here
```

### Running the Frontend

Ensure both your Express and Flask servers are running in separate terminals, then start the React application:

```bash
npm run dev
# or yarn dev
```

**Access the application at:**

```
http://localhost:5173
```

-----

## 🌐 Deployment

The frontend is set up for simple deployment to a static hosting provider like **Netlify** or **Vercel**.

### Netlify Deployment

1.  Connect your GitHub repository to Netlify.
2.  Set the **Base Directory** to `frontend/`.
3.  Set the **Build Command** to `npm run build`.
4.  Set the **Publish Directory** to `frontend/dist`.
5.  In the Netlify UI, set the environment variables exactly as in your local `.env` file (e.g., `VITE_API_URL`, `VITE_FLASK_API_URL`, `VITE_MAPBOX_TOKEN`). **Use the deployed public URLs** for your Express and Flask backends, not `localhost`.

---

<div align="center">

**Part of the Live Ship Vessel Tracker System**

[Main Project](../README.md) | [Express Backend](../backend/README.md) | [AI-Model](../AI-Model/README.md)

🤖 Built with modern web technologies for best UI/UX ~ Ryan Tusi, Full Stack + AI/ML Engineer

</div>