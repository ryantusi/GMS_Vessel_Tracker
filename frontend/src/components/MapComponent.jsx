import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set Mapbox access token globally from Vite environment
// NOTE: Ensure your .env file is named .env.development or similar if running locally
// Keeping this line as it is the correct way in a modern setup:
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function MapComponent({ center = [0, 0], zoom = 2, markers = [], bounds = null }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  // Use a simple state to track loading, initialized to true since we expect to load
  const [isInitializing, setIsInitializing] = useState(true); 

  // 1. Initialize map only once when the component mounts and the container ref is available
  useEffect(() => {
    // Check for the container existence first and ensure map hasn't been initialized
    if (mapContainer.current && !map.current) {
      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          // NOTE: Ensure this custom style URL is accessible with your public token
          style: 'mapbox://styles/ryantusi/cmha8rji8001c01s5c0zv1qah',
          center: center,
          zoom: zoom,
          attributionControl: false, // Prevents Mapbox logo conflicts
        });
        
        // Add controls immediately after map creation
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

        // Once the map finishes loading tiles, set initialization to false
        map.current.on('load', () => {
          setIsInitializing(false);
        });
        
        // Handle potential error during style loading (e.g., bad token or style URL)
        map.current.on('error', (e) => {
            console.error("Mapbox Error:", e);
            // Crucial: Stop loading loop even if error
            setIsInitializing(false); 
        });


      } catch (e) {
        console.error("Mapbox Initialization Failed:", e);
        // If initialization fails for any JS reason, stop the loading screen
        setIsInitializing(false); 
      }
    }
    
    // Cleanup function: Destroy the map instance when the component unmounts
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapContainer]); // Dependency added to re-run ONLY if ref object changes

  // 2. Update markers and bounds when props change
  useEffect(() => {
    // Only proceed if the map object exists AND has finished initializing/loading
    if (!map.current || isInitializing) return;

    // Remove old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers (logic remains the same)
    markers.forEach(marker => {
      const { type, coordinates, properties } = marker;

      // ... (rest of the marker creation logic remains the same) ...

      // Create custom marker element
      const el = document.createElement('div');
      el.className = type === 'vessel' ? 'vessel-marker' : 'port-marker';
      
      if (type === 'vessel') {
        // Simplified marker content for brevity
        el.innerHTML = `<div class="w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-7-5z"/>
            </svg>
          </div>`;
      } else {
        el.innerHTML = `<div class="w-6 h-6 bg-green-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9V5h2v4h4v2h-4v4H9v-4H5V9h4z"/>
          </div>`;
      }


       // Create popup content
      let popupContent = '';
      if (type === 'vessel') {
        popupContent = `
          <div class="p-2">
            <h3 class="font-bold text-lg mb-2">${properties.name}</h3>
            <div class="space-y-1 text-sm">
              <p><strong>IMO:</strong> ${properties.imo}</p>
              <p><strong>Type:</strong> ${properties.type.toUpperCase()}</p>
              <p><strong>Destination:</strong> ${properties.destination || 'Unknown'}</p>
              ${properties.reportedDestination ? `<p><strong>Reported:</strong> ${properties.reportedDestination}</p>` : ''}
            </div>
          </div>
        `;
      } else {
        popupContent = `
          <div class="p-2">
            <h3 class="font-bold text-lg mb-1">📍 ${properties.name}</h3>
            <p class="text-sm text-gray-600">Destination Port</p>
            ${properties.portFor ? `<p class="text-xs mt-1">for ${properties.portFor}</p>` : ''}
          </div>
        `;
      }

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
      }).setHTML(popupContent);

      // Create and add marker
      const mapMarker = new mapboxgl.Marker(el)
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(map.current);

      markersRef.current.push(mapMarker);
    });

    // Fit bounds if provided
    if (bounds && markers.length > 0) {
      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 15,
        duration: 1000 // Smooth animation
      });
    }
  }, [markers, bounds, isInitializing]); // Dependency on isInitializing added

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Loading overlay */}
      {isInitializing && (
        <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading map and tiles...</p>
          </div>
        </div>
      )}

      {/* Custom CSS for markers */}
      <style>{`
        .mapboxgl-popup-content {
          padding: 0;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .mapboxgl-popup-close-button {
          font-size: 20px;
          padding: 4px 8px;
        }
        .vessel-marker, .port-marker {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

export default MapComponent;
