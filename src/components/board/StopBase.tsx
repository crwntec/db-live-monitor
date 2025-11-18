"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Spinner } from "flowbite-react";

import MessageContainer from "./MessageContainer";
import LineContainer from "./LineContainer";
import TimeContainer from "./TimeContainer";
import PathContainer from "./PathContainer";
import WingIndicator from "./WingIndicator";

import { Stop, StopTime, Transport } from "@/types/timetable";
import { calculateDelay } from "@/util";

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

  const constructName = (transport: Transport) =>
    transport
      ? `${transport.category} ${transport.line ? transport.line + "(" + transport.number + ")" : transport.number}`
      : "";

  const handleStopSelect = () => {
    if (!stop.transport.journeyID) return;

    const params = new URLSearchParams({
      referringEva: pathname.split("/")[2] ?? "",
      trainName: stop.transport.category + stop.transport.number,
      lineName: stop.transport.line
        ? stop.transport.category + stop.transport.line
        : "",
      trainNumber: stop.transport.number.toString(),
      date: stop.departure
        ? stop.departure.timeSchedule
        : stop.arrival?.timeSchedule || "",
      onlyArrival: (stop.departure == null).toString(),
    });

    if (wing) {
      params.set("wingId", wing.transport.journeyID ?? "");

      if (isWinged) {
        const start = hasWingInfo
          ? stop.wing?.start.station
          : wing?.wing?.start.station;
        const end = hasWingInfo
          ? stop.wing?.end.station
          : wing?.wing?.end.station;

        if (start) params.set("wingStart", start);
        if (end) params.set("wingDest", end);
        params.set("wingName", constructName(wing.transport));
      }
    }

    startTransition(() => {
      router.push(`/journey/${stop.transport.number}?${params.toString()}`);
    });
  };

  const stopTime: StopTime = {
    time: stop.departure ? stop.departure.time : stop.arrival?.time || "",
    timeScheduled: stop.departure
      ? stop.departure.timeSchedule
      : stop.arrival?.timeSchedule || "",
    diff: calculateDelay(
      stop.departure ? stop.departure.time : stop.arrival?.time || "",
      stop.departure
        ? stop.departure.timeSchedule
        : stop.arrival?.timeSchedule || "",
    ),
  };

  return (
    <div className="flex flex-col gap-2 px-3 py-2 relative">
      {stop.irisDelayMessages?.length === 0 &&
        stop.irisQualityChanges?.length === 0 && (
          <PathContainer
            path={stop.departure?.path ?? stop.arrival?.path ?? []}
          />
        )}
      <MessageContainer stop={stop} />
      <button
        onClick={handleStopSelect}
        className="hover:cursor-pointer flex items-start justify-between w-full p-2 rounded-md transition-colors"
      >
        <div className="flex items-center gap-2">
          {isWinged && <WingIndicator index={index} />}
          <LineContainer transport={stop.transport} />
          <span
            className={`${hasLeft ? "line-through" : ""} ${
              stop.canceled ? "line-through text-red-800" : ""
            } ${
              (stop.transport.differingDestination && !stop.arrival) ||
              (stop.transport.differingOrigin && !stop.departure) ||
              stop.isEarlyTerminated
                ? "text-red-500"
                : ""
            } text-xs sm:text-sm md:text-base break-words`}
          >
            {stop.departure?.destination
              ? `Nach ${
                  stop.isEarlyTerminated && stop.transport.differingDestination
                    ? stop.transport.differingDestination?.name
                    : stop.departure.destination.name
                }`
              : `Von ${
                  stop.transport.differingOrigin?.name ||
                  stop.arrival?.origin.name
                }`}
          </span>
        </div>
        <div className="flex flex-col md:flex-row lg:flex-col gap-2">
          <div className="flex items-center justify-between w-full">
            <TimeContainer time={stopTime} canceled={stop.canceled} />
            <div className="flex justify-end gap-1 w-14">
              <span
                className={`${
                  stop.arrival
                    ? stop.arrival.platformSchedule === stop.arrival.platform
                      ? "text-green-500"
                      : stop.arrival.platformSchedule == ""
                        ? "text-white-500"
                        : "line-through text-red-500"
                    : stop.departure?.platformSchedule ===
                        stop.departure?.platform
                      ? "text-green-500"
                      : stop.departure?.platformSchedule == ""
                        ? "text-white-500"
                        : "line-through text-red-500"
                }`}
              >
                {stop.arrival?.platformSchedule ||
                  stop.departure?.platformSchedule ||
                  stop.arrival?.platform ||
                  stop.departure?.platform}
              </span>
              {(() => {
                const actualPlatform =
                  stop.arrival?.platform || stop.departure?.platform;
                const scheduledPlatform =
                  stop.arrival?.platformSchedule ||
                  stop.departure?.platformSchedule;

                return actualPlatform &&
                  scheduledPlatform &&
                  actualPlatform !== scheduledPlatform ? (
                  <span>{actualPlatform}</span>
                ) : null;
              })()}
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
