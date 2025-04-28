"use client";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  TrainFront,
  List,
  Route,
  TriangleAlert,
} from "lucide-react";
import { JourneyT } from "@/types/journey";

export default function TrainInfo({
  train,
  referringEva,
}: {
  train: JourneyT;
  referringEva: string;
}) {
  const searchParams = useSearchParams();
  const wingId = searchParams.get("wingId");
  const wingStart = searchParams.get("wingStart");
  const wingDest = searchParams.get("wingDest");
  const wingName = searchParams.get("wingName");

  const constructName = (train: JourneyT) => `${train.name}(${train.no})`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg shadow-md">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 font-semibold">
          <Building2 className="w-5 h-5 text-gray-600" />
          <span>{train.operatorName}</span>
        </div>
        <div className="flex items-center gap-2">
          <TrainFront className="w-5 h-5 text-gray-600" />
          <span>{train.no}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <List className="w-5 h-5 text-gray-600" />
          <span>{train.category}</span>
        </div>
        <div className="flex items-center gap-2">
          <Route className="w-5 h-5 text-gray-600" />
          <span>
            {train.stops[0].station.name} →{" "}
            {train.stops[train.stops.length - 1].station.name}
          </span>
        </div>
      </div>

      {/* Train Messages */}
      {train.hims.length > 0 && (
        <div className="col-span-1 sm:col-span-2 border-t mt-5 pt-5 w-full flex flex-col items-center gap-4">
          {train.hims.map((him) => (
            <div
              key={him.id}
              className="flex items-center gap-3 w-full text-yellow-500"
            >
              <TriangleAlert size={15} />
              <div className="flex-1">
                <h3 className="text-sm font-bold break-words whitespace-normal sm:block hidden">
                  {him.caption}
                </h3>
                <p className="text-sm break-words whitespace-normal sm:hidden">
                  {him.shortText}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Canceled Stops */}
      {train.stops.some((s) => s.status === "Canceled") && (
        <div className="col-span-1 sm:col-span-2 border-t pt-5 w-full flex items-center gap-3 text-red-500">
          <TriangleAlert size={15} />
          <div className="flex-1 text-sm font-bold break-words whitespace-normal">
            Ohne Halt in{" "}
            {train.stops
              .filter((s) => s.status === "Canceled")
              .map((s) => s.station.name)
              .join(", ")}
          </div>
        </div>
      )}

      {wingId && (
        <div className="border-t col-span-1 sm:col-span-2 pt-3 mt-3 w-full min-w-0 whitespace-normal break-words">
          Fährt von {wingStart} bis {wingDest} vereeint mit{" "}
          <a
            className="text-blue-500"
            href={`/journey/${wingId}?referringEva=${referringEva}&wingId=${
              train.journeyId
            }&wingStart=${wingStart}&wingDest=${wingDest}&wingName=${constructName(
              train
            )}`}
          >
            {wingName}
          </a>
        </div>
      )}
    </div>
  );
}
