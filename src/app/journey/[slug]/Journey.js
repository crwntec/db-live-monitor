import moment from "moment";
import Navbar from "@/components/Navbar";
import TrainInfo from "@/components/journey/TrainInfo";
import StopsContainer from "@/components/journey/StopsContainer";
import CarriageSequence from "@/components/journey/CarriageSequence";
export default async function Journey({ dataPromise }) {
  const data = await dataPromise;
  return (
    <div className="">
        <Navbar title={data.name} />
      <section className="mb-8 p-4">
        <TrainInfo train={data} />
      </section>

      {/* Stops */}
      <section className="mb-8 p-4">
        <h2 className="text-xl font-semibold mb-3">Zwischenhalte</h2>
        <StopsContainer stops={data.stops} />
      </section>

      {/* Carriage Sequence */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Wagen</h2>
        <div className="space-y-4">
          {data.carriageSequence?.groups?.map((group) => (
            <div key={group.name} className="border p-4 rounded">
              <div className="mb-3">
                <h3 className="font-medium">{group.name}</h3>
                <p className="text-sm text-gray-600">
                  {group.transport.category} {group.transport.number} →{" "}
                  {group.transport.destination.name}
                </p>
              </div>

              <div className="space-y-2">
                {group.vehicles.map((vehicle) => (
                  <div key={vehicle.vehicleID} className="border-t pt-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p>
                        <strong>Wagen:</strong>{" "}
                        {vehicle.wagonIdentificationNumber}
                      </p>
                      <p>
                        <strong>Klasse:</strong>{" "}
                        {vehicle.type.hasFirstClass ? "1." : ""}
                        {vehicle.type.hasEconomyClass ? "2." : ""} Klasse
                      </p>
                      <p>
                        <strong>Typ:</strong> {vehicle.type.category}
                      </p>
                      <p>
                        <strong>Sektor:</strong>{" "}
                        {vehicle.platformPosition.sector}
                      </p>
                      <p>
                        <strong>Ausrichtung:</strong>{" "}
                        {vehicle.orientation === "FORWARDS"
                          ? "Vorwärts"
                          : "Rückwärts"}
                      </p>
                      {vehicle.amenities.length > 0 && (
                        <p>
                          <strong>Ausstattung:</strong>{" "}
                          {vehicle.amenities.map((a) => a.type).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
