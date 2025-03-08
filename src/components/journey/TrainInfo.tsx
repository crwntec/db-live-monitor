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

export default function TrainInfo({ train }: { train: JourneyT}) {
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
        <div className="col-span-1 sm:col-span-2 border-t pt-3 mt-3 w-full">
          {train.hims.map((him) => (
            <div
              className="mb-2 flex items-start sm:items-center space-x-2 w-full"
              key={him.id}
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

      {wingId && (
        <div className="border-t col-span-1 sm:col-span-2 pt-3 mt-3 w-full min-w-0 whitespace-normal break-words">
          Fährt von {wingStart} bis {wingDest} vereeint mit{" "}
          <a
            className="text-blue-500"
            href={`/journey/${wingId}?wingId=${
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
