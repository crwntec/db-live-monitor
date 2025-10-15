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
import moment from "moment";

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
      ? `${transport.category} ${transport.line} (${transport.number})`
      : "";

  const handleStopSelect = () => {
    if (!stop.transport.journeyID) return;

    const params = new URLSearchParams({
      referringEva: pathname.split("/")[2] ?? "",
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
      router.push(`/journey/${stop.transport.journeyID}?${params.toString()}`);
    });
  };
  function calculateDelay(timeString: string, scheduledTimestring: string) {
    const time = moment(timeString);
    const plannedTime = moment(scheduledTimestring);
    return time.diff(plannedTime, "minutes");
  }

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
          <LineContainer transport={stop.transport} />
          <span
            className={`${hasLeft ? "line-through" : ""} ${
              stop.canceled ? "line-through text-red-800" : ""
            } ${
              stop.transport.differingDestination ||
              stop.transport.differingOrigin ||
              stop.isEarlyTerminated
                ? "text-red-500"
                : ""
            } text-sm md:text-base`}
          >
            {stop.departure?.destination
              ? `Nach ${stop.isEarlyTerminated ? stop.transport.differingDestination : stop.departure.destination.name}`
              : `Von ${stop.transport.differingOrigin?.name || stop.arrival?.origin.name}`}
          </span>
        </div>
        <div className="flex flex-col md:flex-row lg:flex-col gap-2">
          <div className="flex items-center justify-between w-full">
            <TimeContainer time={stopTime} canceled={stop.canceled} />
            <div className="flex justify-end gap-1 w-14">
              <span
                className={`${
                  stop.arrival?.platformSchedule === stop.arrival?.platform
                    ? "text-green-500"
                    : "line-through text-red-500"
                }`}
              >
                {stop.arrival?.platform || stop.departure?.platform}
              </span>
              {stop.arrival?.platformSchedule !== stop.arrival?.platform && (
                <span>{stop.arrival?.platform}</span>
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
