"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Spinner } from "flowbite-react";

import MessageContainer from "./MessageContainer";
import LineContainer from "./LineContainer";
import TimeContainer from "./TimeContainer";
import PathContainer from "./PathContainer";
import WingIndicator from "./WingIndicator";

import { Stop, StopTime, WebAPITrain } from "@/types/timetable";

export default function StopBase({
  stop,
  stopGroup,
  hasLeft,
  index,
}: {
  stop: Stop;
  stopGroup: Stop[];
  hasLeft: boolean;
  index: number;
}) {
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();

  const isWinged = stopGroup.length > 1;
  const hasWingInfo = stop.wing != null;
  const wing = isWinged ? stopGroup[index === 0 ? 1 : 0] : null;

  const constructName = (train: WebAPITrain) =>
    train ? `${train.category} ${train.lineName} (${train.no})` : "";


  const handleStopSelect = () => {
    if (!stop.train.journeyId) return;

    const params = new URLSearchParams({
      referringEva: pathname.split("/")[2] ?? "",
    });

    if (wing) {
      params.set("wingId", wing.train.journeyId ?? "");

      if (isWinged) {
        const start = hasWingInfo
          ? stop.wing?.start.station
          : wing?.wing?.start.station;
        const end = hasWingInfo
          ? stop.wing?.end.station
          : wing?.wing?.end.station;

        if (start) params.set("wingStart", start);
        if (end) params.set("wingDest", end);
        params.set("wingName", constructName(wing.train));
      }
    }

    startTransition(() => {
      router.push(`/journey/${stop.train.journeyId}?${params.toString()}`);
    });
  };

  const stopTime =
    (stop.departure && stop.departure.destination
      ? stop.departure
      : stop.arrival) as StopTime;

  return (
    <div className="flex flex-col gap-2 px-3 py-2 relative">
      {stop.delayMessages?.length === 0 &&
        stop.qualityChanges?.length === 0 && (
          <PathContainer
            path={stop.departure?.path ?? stop.arrival?.path ?? []}
          />
        )}
      <MessageContainer stop={stop} />
      <button
        onClick={handleStopSelect}
        className="hover:cursor-pointer flex items-center justify-between w-full p-2 rounded-md transition-colors"
      >
        <div className="flex items-center gap-2">
          {isWinged && <WingIndicator index={index} />}
          <LineContainer train={stop.train} />
          <span
            className={`${hasLeft ? "line-through" : ""} ${
              stop.canceled ? "line-through text-red-800" : ""
            } ${
              (stop.departure?.path && !stop.departure?.destination) ||
              (stop.isEarlyTerminated || stop.departure?.destination.canceled)
                ? "text-red-500"
                : ""
            } text-sm md:text-base`}
          >
            {stop.departure?.destination
              ? `Nach ${stop.departure.destination.canceled ? stop.departure.path.filter(stop => !stop.canceled).at(-1)?.name : stop.departure.destination.name}`
              : `Von ${stop.arrival?.origin.canceled ? stop.arrival.path.filter(stop => !stop.canceled).at(-1)?.name : stop.arrival?.origin.name}`}
          </span>
        </div>
        <div className="flex flex-col md:flex-row lg:flex-col gap-2">
          <div className="flex items-center justify-between w-full">
            <TimeContainer time={stopTime} canceled={stop.canceled} />
            <div className="flex justify-end gap-1 w-14">
              <span
                className={`${
                  stop.arrival?.platform === stop.arrival?.platformPredicted
                    ? "text-green-500"
                    : "line-through text-red-500"
                }`}
              >
                {stop.arrival?.platform || stop.departure?.platform}
              </span>
              {stop.arrival?.platform !== stop.arrival?.platformPredicted && (
                <span>{stop.arrival?.platformPredicted}</span>
              )}
            </div>
          </div>
        </div>
      </button>

      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/50 z-10 rounded-md">
          <Spinner size="sm" />
        </div>
      )}
    </div>
  );
}
