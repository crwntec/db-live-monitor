import { Tooltip } from "flowbite-react";
import { UsersRound } from "lucide-react";

export default function LoadFactor({ loadFactor }: { loadFactor: string }) {
  const loadFactorToText = (loadFactor: string) => {
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
        return "";
    }
  };

  const loadFactorToColor = (loadFactor: string) => {
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

  // Get color for the current mode (light/dark)
  const colors = loadFactorToColor(loadFactor);

  return (
    <span>
      <Tooltip content={loadFactorToText(loadFactor)} className="dark:bg-gray-800 bg-gray-200 text-black dark:text-white">
        <UsersRound
          size={16}
          style={{
            cursor: "pointer",
            color: colors.light, // Default light mode color
            transition: "color 0.3s"
          }}
          className="dark:text-transparent" // Ensures icon is transparent in dark mode if necessary
        />
      </Tooltip>
    </span>
  );
}
