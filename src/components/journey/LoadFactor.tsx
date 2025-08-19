import { loadFactorToColor, loadFactorToText } from "@/util";
import { Tooltip } from "flowbite-react";
import { UsersRound } from "lucide-react";

export default function LoadFactor({ loadFactor }: { loadFactor: string }) {
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
