import { Stop } from "@/types/timetable";
import { Stop as JourneyStop } from "@/types/journey";
import moment from "moment-timezone"; // This would be in lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hasLeft(item: Stop, lookBack: number) {
  const nowTimestamp = moment().tz("Europe/Berlin");
  const time = moment(
    item.departure ? item.departure.timePredicted : item.arrival?.timePredicted
  ).tz("Europe/Berlin");
  return time.isBefore(nowTimestamp.subtract(lookBack, "minutes"));
}

export function getTime(stop: Stop, usePredicted = false) {
  const departureTime = usePredicted
    ? stop.departure?.timePredicted
    : stop.departure?.time;
  const arrivalTime = usePredicted
    ? stop.arrival?.timePredicted
    : stop.arrival?.time;
  return (
    departureTime || arrivalTime || moment().tz("Europe/Berlin").toISOString()
  );
}
export function getTimeJourney(stop: JourneyStop, usePredicted = false) {
  if (!stop) return moment().tz("Europe/Berlin").toISOString();
  const departureTime = usePredicted
    ? stop.departureTime?.predicted
    : stop.departureTime?.target;
  const arrivalTime = usePredicted
    ? stop.arrivalTime?.predicted
    : stop.arrivalTime?.target;
  return (
    departureTime || arrivalTime || moment().tz("Europe/Berlin").toISOString()
  );
}
export const loadFactorToText = (loadFactor: number | string, readable = true) => {
  if (typeof loadFactor === "number") {
    switch (loadFactor) {
      case 0:
        return readable ? "Niedrig" : "low";
      case 1:
        return readable ? "Niedrig bis mittel" : "low-to-medium";
      case 2:
        return readable ? "Hoch" : "high";
      case 3:
        return readable ? "Sehr hoch" : "very-high";
      case 4:
        return readable ? "Außergewöhnlich hoch" : "exceptionally-high";
      case 5:
        return readable ? "Zug ausgebucht" : "full";
      default:
        return "N/A";
    }
  } else if (typeof loadFactor === "string") {
    switch (loadFactor) {
      case "low":
        return "Niedrig";
      case "low-to-medium":
        return "Niedrig bis mittel";
      case "high":
        return "Hoch";
      case "very-high":
        return "Sehr hoch";
      case "exceptionally-high":
        return "Außergewöhnlich hoch";
      case "full":
        return "Zug ausgebucht";
      default:
        return "N/A";
    }
  }
  return "";
};
export const loadFactorToColor = (loadFactor: string) => {
    switch (loadFactor) {
      case "low":
        return {
          light: "#28a745", // Green in light mode
          dark: "#66bb6a"   // Lighter green in dark mode
        };
      case "low-to-medium":
        return {
          light: "#ffc107", // Yellow in light mode
          dark: "#ffb300"   // Darker yellow in dark mode
        };
      case "high":
        return {
          light: "#fd7e14", // Orange in light mode
          dark: "#ff5722"   // Darker orange in dark mode
        };
      case "very-high":
        return {
          light: "#dc3545", // Red in light mode
          dark: "#e53935"   // Darker red in dark mode
        };
      case "exceptionally-high":
        return {
          light: "#c82333", // Dark red in light mode
          dark: "#d32f2f"   // Even darker red in dark mode
        };
      case "full":
        return {
          light: "#dc3545", // Red in light mode
          dark: "#e53935"   // Darker red in dark mode
        };
      default:
        return {
          light: "#6c757d", // Grey in light mode
          dark: "#9e9e9e"   // Dark grey in dark mode
        };
    }
  };
