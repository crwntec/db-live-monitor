import { getJourneyFromTrainNumber } from "@/app/api/journey";
import Journey from "./Journey";
import {getEVAFromDS100} from "@/app/api/station.ts";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ referringEva: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const evaNo = await getEVAFromDS100(sp["referringEva"]);
  if (!evaNo) return <>Error</>

  const dataPromise = getJourneyFromTrainNumber(
    sp["trainName"],
    sp["lineName"],
    slug,
    evaNo[0].toString(),
    sp["date"],
      sp["onlyArrival"]
  );

  return (
    <>
      <Journey dataPromise={dataPromise} referringEva={sp["referringEva"]} />
    </>
  );
}
