import { IrisPathItem } from "@/types/iris";

export default function PathContainer({ path }: { path: IrisPathItem[] }) {
  if (!path?.length) return null;

  const canceledStops = path.filter(stop => stop.canceled);

  const content = canceledStops.length > 0
    ? `Ohne Halt in: ${canceledStops.map(stop => stop.name).join(", ")}`
    : [...path]
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 3)
        .map(stop => stop.name)
        .join(" • ");

  return (
    <div
      className={`text-xs sm:text-sm ${
        canceledStops.length > 0 ? "font-semibold text-red-500" : "text-gray-500"
      }`}
    >
      {content}
    </div>
  );
}
