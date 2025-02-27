export default function PathContainer({ path }) {
  if (!path || !Array.isArray(path)) return null;

  let relevantStops = [...path]
    .sort((a, b) => b.relevance - a.relevance) // Sort in descending order by relevance
    .slice(0, 3) // Limit to top 3 items
    .map(stop => stop.name) // Extract only names
    .join(" • "); // Join names with " • "

  return <div>{relevantStops}</div>;
}
