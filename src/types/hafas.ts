import { StopOver } from "hafas-client";

export type JourneyMapData = {
  route: GeoJSON.FeatureCollection;
  stops: GeoJSON.FeatureCollection;
};

export interface ExtendedStopOver extends StopOver {
  loadFactor?: string;
}
