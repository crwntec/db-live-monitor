import Board from "./board";
import { getEVAFromDS100 } from "@/app/api/station";
import { getTimetableForStation } from "@/app/api/timetable";

async function fetchTimetable(params: Promise<{ slug: string }>) {
  try {
    const slug = (await params).slug;
    const evaIds = await getEVAFromDS100(slug);
    if (!evaIds) return null;

    const data = await getTimetableForStation(evaIds[0].toString(), 7);
    return data;
  } catch (error) {
    console.error("Error fetching timetable:", error);
    return null;
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const data = fetchTimetable(params);

  return (
    <div>
      <Board dataPromise={data} />
    </div>
  );
}
