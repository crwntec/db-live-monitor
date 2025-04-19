import { getJourneyFromJID } from "@/app/api/journey";
import Journey from "./Journey";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ referringEva: string }>;
}) {
  const { slug } = await params;

  const dataPromise = getJourneyFromJID(slug);

  return (
    <>
      <Journey
        dataPromise={dataPromise}
        referringEva={(await searchParams)["referringEva"]}
      />
    </>
  );
}
