import { getJourneyFromTrainNumber } from "@/app/api/journey";
import Journey from "./Journey";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ referringEva: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const dataPromise = getJourneyFromTrainNumber(
    sp["trainName"],
    slug,
    sp["referringEva"],
    sp["date"],
  );

  return (
    <>
      <Journey dataPromise={dataPromise} referringEva={sp["referringEva"]} />
    </>
  );
}
