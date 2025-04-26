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
        break;
    }
  };
  const loadFactorToColor = (loadFactor: string) => {
    switch (loadFactor) {
      case "low":
        return "green";
      case "low-to-medium":
        return "yellow";
      case "high":
        return "orange";
      case "very-high":
        return "red";
      case "exceptionally-high":
        return "red";
      case "full":
        return "red";
      default:
        break;
    }
  }
  return (
    <span>
      <Tooltip content={loadFactorToText(loadFactor)}>
        <UsersRound size={16} color={loadFactorToColor(loadFactor)} />
      </Tooltip>
    </span>
  );
}
