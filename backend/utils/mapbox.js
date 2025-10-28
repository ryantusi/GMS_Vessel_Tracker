// mapbox.js - Helper functions for creating map data structures

/**
 * Creates map data for a single vessel with both vessel location and destination port
 * @param {Object} vesselData - Normalized vessel data
 * @returns {Object} Map configuration with markers and bounds
 */
export function createSingleVesselMap(vesselData) {
  const markers = [];

  // Add vessel marker (if coordinates exist)
  if (vesselData.latitude && vesselData.longitude) {
    markers.push({
      type: "vessel",
      coordinates: [vesselData.longitude, vesselData.latitude],
      properties: {
        imo: vesselData.imo,
        name: vesselData.name,
        type: vesselData.type,
        destination:
          typeof vesselData.ais_destination === "object"
            ? vesselData.ais_destination.destination
            : vesselData.ais_destination,
        reportedDestination: vesselData.reportedDestination,
      },
    });
  }

  // Add destination port marker (if available)
  if (
    typeof vesselData.ais_destination === "object" &&
    vesselData.ais_destination.lat &&
    vesselData.ais_destination.lon
  ) {
    markers.push({
      type: "port",
      coordinates: [
        vesselData.ais_destination.lon,
        vesselData.ais_destination.lat,
      ],
      properties: {
        name: vesselData.ais_destination.destination,
        portFor: vesselData.name,
      },
    });
  }

  // Calculate bounds to fit all markers
  const bounds = calculateBounds(markers);

  return {
    markers,
    bounds,
    center: markers.length > 0 ? markers[0].coordinates : [0, 0],
    zoom: markers.length === 1 ? 8 : null, // Auto-fit if multiple markers
  };
}

/**
 * Creates map data for multiple vessels (batch view)
 * Only shows vessel locations, not destination ports
 * @param {Array} vesselsData - Array of normalized vessel data
 * @returns {Object} Map configuration with all vessel markers and bounds
 */
export function createBatchVesselMap(vesselsData) {
  const markers = [];

  // Add markers for all vessels with valid coordinates
  vesselsData.forEach((vessel) => {
    if (vessel.latitude && vessel.longitude) {
      markers.push({
        type: "vessel",
        coordinates: [vessel.longitude, vessel.latitude],
        properties: {
          imo: vessel.imo,
          name: vessel.name,
          type: vessel.type,
          destination:
            typeof vessel.ais_destination === "object"
              ? vessel.ais_destination.destination
              : vessel.ais_destination,
          reportedDestination: vessel.reportedDestination,
        },
      });
    }
  });

  // Calculate bounds to fit all vessel markers
  const bounds = calculateBounds(markers);

  return {
    markers,
    bounds,
    center: markers.length > 0 ? calculateCenter(markers) : [0, 0],
    zoom: null, // Auto-fit to show all vessels
    totalVessels: vesselsData.length,
    vesselsWithLocation: markers.length,
  };
}

/**
 * Calculate bounding box for all markers
 * @param {Array} markers - Array of marker objects
 * @returns {Array|null} Bounding box [[minLng, minLat], [maxLng, maxLat]] or null
 */
function calculateBounds(markers) {
  if (markers.length === 0) return null;

  let minLng = Infinity,
    maxLng = -Infinity;
  let minLat = Infinity,
    maxLat = -Infinity;

  markers.forEach((marker) => {
    const [lng, lat] = marker.coordinates;
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });

  // Add padding (5% on each side)
  const lngPadding = (maxLng - minLng) * 0.05;
  const latPadding = (maxLat - minLat) * 0.05;

  return [
    [minLng - lngPadding, minLat - latPadding],
    [maxLng + lngPadding, maxLat + latPadding],
  ];
}

/**
 * Calculate center point of all markers
 * @param {Array} markers - Array of marker objects
 * @returns {Array} Center coordinates [lng, lat]
 */
function calculateCenter(markers) {
  if (markers.length === 0) return [0, 0];

  const sum = markers.reduce(
    (acc, marker) => {
      acc.lng += marker.coordinates[0];
      acc.lat += marker.coordinates[1];
      return acc;
    },
    { lng: 0, lat: 0 }
  );

  return [sum.lng / markers.length, sum.lat / markers.length];
}

/**
 * Generate GeoJSON feature collection from markers
 * Useful for direct Mapbox GL JS integration
 * @param {Array} markers - Array of marker objects
 * @returns {Object} GeoJSON FeatureCollection
 */
export function markersToGeoJSON(markers) {
  return {
    type: "FeatureCollection",
    features: markers.map((marker) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: marker.coordinates,
      },
      properties: {
        ...marker.properties,
        markerType: marker.type,
      },
    })),
  };
}
