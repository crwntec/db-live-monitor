import { getJourney } from "@/app/api/journey";
import Journey from "./Journey";

export default async function Page({ params, searchParams } : { params: Promise<{ slug: string }>, searchParams: Promise<{ referringEva: string }> }) {
  const { slug } = await params;

  const dataPromise = getJourney(slug);

  return (
    <div>
      <Journey dataPromise={dataPromise} referringEva={(await searchParams)['referringEva']} />
    </div>
  );
}
