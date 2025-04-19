import { FeatureCollection } from "hafas-client";
import {
  Position,
} from "geojson";
import { JourneyMapData } from "@/types/hafas";

export function extractRouteAndStops (
  polyline: FeatureCollection
): JourneyMapData {
  const polylineCoords: Position[] = polyline.features
    .filter((feature) => Object.keys(feature.properties).length === 0)
    .map((feature) => feature.geometry.coordinates);
  const stops = polyline.features.filter(
    (feature) =>
      Object.keys(feature.properties).length !== 0 &&
      "type" in feature.properties &&
      feature.properties.type === "stop"
  );

  return {
    route: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: polylineCoords,
          },
        },
      ],
    },
    stops: {
      type: "FeatureCollection",
      features: stops,
    },
  };
}
