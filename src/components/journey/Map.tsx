"use client";
import { FeatureCollection } from "hafas-client";
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { extractRouteAndStops } from "@/lib/hafas/polyline";
import { JourneyMapData } from "@/types/hafas";

export default function Map({ polyline }: { polyline: FeatureCollection }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  // const data: GeoJSON.FeatureCollection = {
  //   type: "FeatureCollection",
  //   features: [
  //     {
  //       type: "Feature",
  //       properties: {},
  //       geometry: {
  //         type: "LineString",
  //         coordinates: [
  //           [8.5402, 47.3782],
  //           [8.5415, 47.3778],
  //           [8.5432, 47.3771],
  //         ],
  //       },
  //     },
  //   ],
  // };
  const mapData: JourneyMapData = extractRouteAndStops(polyline);
  useEffect(() => {
    if (!mapContainer.current) return;
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style:
        "https://api.maptiler.com/maps/01964ee0-cb8e-7ab4-bb32-d871ee8e7fc5/style.json?key=QGHGPi2BJeIQvWNFNknk",
      center: [polyline.features[0].geometry.coordinates[0], polyline.features[0].geometry.coordinates[1]],
      zoom: 12,
    });
    map.on("load", () => {
      map.addSource("route", {
        type: "geojson",
        data:  mapData.route,
      });
      map.addSource("stops", {
        type: "geojson",
        data: mapData.stops,
      })
      map.addLayer({
        id: "route",
        type: "line",
        source: "route",
        paint: {
          "line-color": "#007bff",
          "line-width": 4,
        },
      });
      map.addLayer({
        id: "stops",
        type: "circle",
        source: "stops",
        paint: {
          "circle-color": "#007bff",
          "circle-radius": 5,
        },
      });
      map.addLayer({
        id: "stop-labels",
        type: "symbol",
        source: "stops",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 12,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#333",
          "text-halo-color": "#fff",
          "text-halo-width": 1,
        },
      });
      const coordinates = mapData.route.features.flatMap(
        (feature) =>
          feature.geometry.type === "LineString" ? feature.geometry.coordinates : []
      );

      if (coordinates.length) {
        const bounds = coordinates.reduce(
          (b, coord) => b.extend(new maplibregl.LngLat(coord[0], coord[1])),
          new maplibregl.LngLatBounds(
            new maplibregl.LngLat(coordinates[0][0], coordinates[0][1]),
            new maplibregl.LngLat(coordinates[0][0], coordinates[0][1])
          )
        );
        map.fitBounds(bounds, { padding: 40 });
      }
    });
  }, [mapData]);
  return <div ref={mapContainer} className="w-full h-[400px]"></div>;
}


