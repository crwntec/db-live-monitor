import {
  parseCategory,
  parseAmenities,
  parseUICIdentifier,
  parseClassNumber,
  parseCountrycode,
  getLongNameForClassNumber,
  formatUIC,
} from "@/util/carriageSequence";
import {
  TrainFront,
  ClipboardList,
  User,
  Layers,
  MapPin,
  ArrowLeftRight,
} from "lucide-react";
import { CarriageSequenceT } from "@/types/carriageSequence";

export default function CarriageSequence({ carriageSequence }:{ carriageSequence: CarriageSequenceT | null }) {
  //   console.log(carriageSequence);
  return (
    <div>
      <div className="space-y-4">
        {carriageSequence?.groups?.map((group) => (
          <div key={group.name} className="border p-4 rounded shadow-sm">
            <div className="mb-3">
              <h3 className="font-medium flex items-center gap-2">
                <TrainFront size={16} />{" "}
                {group.name.length == 12 ? formatUIC(group.name) : group.name}
              </h3>
              <p>
                {getLongNameForClassNumber(
                  parseUICIdentifier(group.vehicles[0].vehicleID).classNumber
                )}{" "}
                (
                {
                  parseCountrycode(
                    parseUICIdentifier(group.vehicles[0].vehicleID).countryCode
                  ).short
                }
                )
              </p>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Layers size={14} />
                {group.transport.category} {group.transport.number} →{" "}
                {group.transport.destination.name}
              </p>
            </div>

            <div className="space-y-2">
              {group.vehicles.map((vehicle) => (
                <div key={vehicle.vehicleID} className="border-t pt-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <ClipboardList size={14} strokeWidth={3} />
                      <strong className="md:block hidden">Wagen:</strong>{" "}
                      {vehicle.wagonIdentificationNumber}
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={14} strokeWidth={3} />
                      <strong className="md:block hidden">Klasse:</strong>{" "}
                      {vehicle.type.hasFirstClass &&
                      vehicle.type.hasEconomyClass
                        ? "1./2. Klasse"
                        : vehicle.type.hasFirstClass
                        ? "1.Klasse"
                        : "2. Klasse"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers size={14} strokeWidth={3} />
                      <strong className="md:block hidden">Typ:</strong>{" "}
                      {parseCategory(vehicle.type.category)} (
                      {vehicle.type.constructionType ||
                        parseClassNumber(
                          parseUICIdentifier(vehicle.vehicleID)
                            .classNumber
                        )}
                      )
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} strokeWidth={3} />
                      <strong className="md:block hidden">Sektor:</strong>{" "}
                      {vehicle.platformPosition.sector || "N/A"}
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowLeftRight size={14} strokeWidth={3} />
                      <strong className="md:block hidden">
                        Ausrichtung:
                      </strong>{" "}
                      {vehicle.orientation === "FORWARDS"
                        ? "Vorwärts"
                        : "Rückwärts"}
                    </div>
                    {vehicle.amenities.length > 0 && (
                      <div className="flex items-center gap-2">
                        <strong className="md:block hidden">
                          Ausstattung:
                        </strong>
                        {vehicle.amenities.map((a, index) => (
                          <span key={index} className="flex items-center gap-1">
                            {parseAmenities(a.type)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
