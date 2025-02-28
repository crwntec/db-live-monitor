import { hasLeft } from "@/util";
import StopGroup from "@/components/board/StopGroup";
import Navbar from "@/components/Navbar";

export default async function Board({ dataPromise }) {
  const data = await dataPromise;
  if (!data?.items || !data) return <div>Fehler beim Laden der Daten</div>;

  return (
    <div>
      <Navbar title={data.stationName} />
      <ul>
        {data.items.map((stopGroup, index) =>
          !hasLeft(stopGroup[0], 10) && (
            <StopGroup stopGroup={stopGroup} index={index} key={stopGroup[0].train.journeyId || index} />
          )
        )}
      </ul>
    </div>
  );
}
