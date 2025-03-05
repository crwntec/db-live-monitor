import { getJourney } from "@/api/journey";
import Journey from "./Journey";

export default async function Page({ params, searchParams }) {
  const { slug } = await params;

  const dataPromise = getJourney(slug);

  return (
    <div>
      <Journey dataPromise={dataPromise} referringEva={searchParams['referringEva']} />
    </div>
  );
}
