import { getJourney } from "@/api/journey";
import Journey from "./Journey";

export default async function Page({ params }) {
  const { slug } = params;

  const dataPromise = getJourney(slug);

  return (
    <div>
      <Journey dataPromise={dataPromise} />
    </div>
  );
}
