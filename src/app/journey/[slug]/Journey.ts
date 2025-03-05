import Navbar from "@/components/Navbar";
import TrainInfo from "@/components/journey/TrainInfo";
import StopsContainer from "@/components/journey/StopsContainer";
import CarriageSequence from "@/components/journey/CarriageSequence";
export default async function Journey({ dataPromise, referringEva }) {
  const data = await dataPromise;
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
        <CarriageSequence carriageSequence={data.carriageSequence} />
      </section>
    </div>
  );
}
