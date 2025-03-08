import Navbar from "@/components/Navbar";
import TrainInfo from "@/components/journey/TrainInfo";
import StopsContainer from "@/components/journey/StopsContainer";
import CarriageSequence from "@/components/journey/CarriageSequence";
import { JourneyT } from "@/types/journey";
export default async function Journey({ dataPromise, referringEva }: { dataPromise: Promise<JourneyT | null>; referringEva: string }) {
  const data = await dataPromise;
  if (!data) return <div>Fehler beim Laden der Daten</div>;
  return (
    <div className="">
      <Navbar title={data.name} referring={`/board/${referringEva}`}/>
      <section className="mb-8 p-4">
        <TrainInfo train={data} />
      </section>

      {/* Stops */}
      <section className="mb-8 p-4">
        <h2 className="text-xl font-semibold mb-3">Zwischenhalte</h2>
        <StopsContainer stops={data.stops} />
      </section>

      {/* Carriage Sequence */}
      <section className="mb-8 p-4">
        <h2 className="text-xl font-semibold mb-3">Wagenreihung</h2>
        <CarriageSequence carriageSequence={data.carriageSequence || null} />
      </section>
    </div>
  );
}
