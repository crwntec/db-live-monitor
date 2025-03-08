import { hasLeft } from "@/util";
import StopGroup from "@/components/board/StopGroup";
import Navbar from "@/components/Navbar";
import { StationData } from "@/types/timetable";

export default async function Board({ dataPromise }: { dataPromise: Promise<StationData | null> }) {
  const data = await dataPromise;
  if (!data || !data?.stopGroups) return <div>Fehler beim Laden der Daten</div>;

  return (
    <div>
      <Navbar title={data.stationName} referring={'/'} />
      <ul>
        {data.stopGroups.map((stopGroup, index) =>
          !hasLeft(stopGroup[0], 10) && (
            <StopGroup stopGroup={stopGroup} index={index} key={stopGroup[0].train.journeyId || index} />
          )
        )}
      </ul>
    </div>
  );
}
