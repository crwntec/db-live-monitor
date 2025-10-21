"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import { Clock, Info, TriangleAlert } from "lucide-react";
import moment from "moment";
import { getDelayColor } from "@/util/colors";
import { cn, getTimeJourney } from "@/util";
import LoadFactor from "./LoadFactor";
import { useRouter } from "next/navigation";
import { StopOver } from "hafas-client";

export default function StopsContainer({
  stops,
}: {
  stops: (StopOver & { loadFactor?: string })[];
}) {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [heigthProgress, setHeightProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(
    moment().tz("Europe/Berlin").add(0, "minutes")
  );
  const notCancelledStops = stops.filter((stop) => !stop.cancelled);
  const cancelledStops = stops.filter((stop) => stop.cancelled);
 const calculateAndSetProgress = () => {
  if (notCancelledStops.length < 2) {
    setProgress(0);
    setHeightProgress(0);
    return;
  }

  const firstStop = notCancelledStops[0];
  const lastStop = notCancelledStops[notCancelledStops.length - 1];

  const startTime = moment(getTimeJourney(firstStop, true)).valueOf();
  const endTime = moment(getTimeJourney(lastStop, true)).valueOf();
  const now = currentTime.valueOf();

  // Find the index of the first non-cancelled stop in the original stops array
  const firstStopOriginalIndex = stops.findIndex(s => s === firstStop);
  const stopPositions = stops.map(
    (_, index) => (index / (stops.length - 1)) * 100
  );
  const startingHeight = stopPositions[firstStopOriginalIndex];

  if (now <= startTime) {
    setProgress(0);
    setHeightProgress(startingHeight); // Start at first non-cancelled stop
    return;
  }
  if (now >= endTime) {
    setProgress(100);
    setHeightProgress(100);
    return;
  }

  // Find the last completed stop and next stop
  let prevStop = firstStop;
  let nextStop = lastStop;
  let prevStopIndex = 0;
  let nextStopIndex = notCancelledStops.length - 1;
  for (let i = 1; i < notCancelledStops.length; i++) {
    const stopTime = moment(getTimeJourney(notCancelledStops[i], true)).valueOf();
    if (stopTime > now) {
      nextStop = notCancelledStops[i];
      nextStopIndex = i;
      break;
    }
    prevStop = notCancelledStops[i];
    prevStopIndex = i;
  }

  const prevTime = moment(getTimeJourney(prevStop, true)).valueOf();
  const nextTime = moment(getTimeJourney(nextStop, true)).valueOf();

  // Linear interpolation between the two stops
  const segmentProgress = (now - prevTime) / (nextTime - prevTime);

  // Determine overall progress based on time
  const overallProgress =
    ((prevTime - startTime) / (endTime - startTime)) * 100 +
    segmentProgress * ((nextTime - prevTime) / (endTime - startTime)) * 100;

  // Find original indices for height calculation
  const prevStopOriginalIndex = stops.findIndex(s => s === prevStop);
  const nextStopOriginalIndex = stops.findIndex(s => s === nextStop);

  const heightProgress = stopPositions[prevStopOriginalIndex] +
    segmentProgress *
    (stopPositions[nextStopOriginalIndex] - stopPositions[prevStopOriginalIndex]);
  
  setHeightProgress(heightProgress);
  setProgress(overallProgress);
};

  useEffect(() => {
    calculateAndSetProgress();
    const interval = setInterval(() => {
      setCurrentTime(moment().tz("Europe/Berlin"));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    calculateAndSetProgress();
  }, [currentTime, stops]);

  const handleStopSelect = useCallback(
    (evaNo: string) => {
      startTransition(() => {
        router.push(`/board/${evaNo}`);
      });
    },
    [router]
  );

  const isCurrentStop = (stop: StopOver, index: number) => {
    const arrivalTime = moment(stop.arrival || stop.plannedArrival || 0);
    const departureTime = moment(stop.departure || stop.plannedDeparture || 0);

    // First stop is current if we haven't departed yet
    if (index === 0 && departureTime.isValid()) {
      return (
        currentTime.isBefore(departureTime) || currentTime.isSame(departureTime)
      );
    }

    // Last stop is current if we've arrived
    if (index === stops.length - 1 && arrivalTime.isValid()) {
      return (
        currentTime.isAfter(arrivalTime) || currentTime.isSame(arrivalTime)
      );
    }

    // For middle stops, we're at the stop if we're between arrival and departure
    if (arrivalTime.isValid() && departureTime.isValid()) {
      return (
        (currentTime.isAfter(arrivalTime) || currentTime.isSame(arrivalTime)) &&
        (currentTime.isBefore(departureTime) ||
          currentTime.isSame(departureTime))
      );
    }

    // Fallback logic
    return (
      (arrivalTime.isValid() &&
        (currentTime.isAfter(arrivalTime) ||
          currentTime.isSame(arrivalTime))) ||
      (departureTime.isValid() &&
        (currentTime.isBefore(departureTime) ||
          currentTime.isSame(departureTime)))
    );
  };

  const isCompletedStop = (stop: StopOver, index: number) => {
    // Last stop is completed if we've arrived
    if (index === stops.length - 1) {
      const arrivalTime = moment(stop.arrival || stop.plannedArrival);
      return arrivalTime.isValid() && currentTime.isAfter(arrivalTime);
    }

    // Other stops are completed if we've departed
    const departureTime = moment(stop.departure || stop.plannedDeparture);
    return departureTime.isValid() && currentTime.isAfter(departureTime);
  };

  return (
    <div className="space-y-2">
      <div className="mt-4">
        <div className="w-full bg-gray-500 h-2.5 rounded-full">
          <div
            style={{ width: `${progress}%` }}
            className=" relative bg-blue-500 h-2.5 rounded-full transition-all duration-1000 ease-in-out"
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>{moment(notCancelledStops[0].departure || 0).format("HH:mm")}</span>
          <span>{Math.round(progress)}%</span>
          <span>
            {moment(notCancelledStops[notCancelledStops.length - 1].arrival || 0).format("HH:mm")}
          </span>
        </div>
      </div>
      <div className="relative">
        {/* Progress bar background */}
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-500" />

        {/* Progress bar fill */}
        <div
          className="absolute left-3 top-0 w-0.5 bg-blue-500 transition-all duration-1000 ease-in-out"
          style={{ height: `${heigthProgress}%` }}
        />

        {/* Stops */}
        <div className="space-y-6">
          {stops.map((stop, index) => {
            const isCompleted = isCompletedStop(stop, index);
            const isCurrent = isCurrentStop(stop, index);
            const isCanceled = stop.cancelled;

            const hints = stop.remarks?.filter((r) => r.type === "hint") || [];
            const statuses =
              stop.remarks?.filter((r) => r.type === "status") || [];
            const warnings =
              stop.remarks?.filter(
                (r) =>
                  r.type === "warning" ||
                  r.type === "foreign-id" ||
                  r.type === "local-fare-zone" ||
                  r.type === "stop-website" ||
                  r.type === "stop-dhid" ||
                  r.type === "transit-authority"
              ) || [];
            return (
              <div key={stop.stop?.id} className="relative pl-10">
                {/* Station marker */}
                <div
                  className={cn(
                    "absolute left-2 w-3 h-3 rounded-full border-2 flex items-center justify-center z-10",
                    isCompleted
                      ? "bg-blue-500 border-blue-500"
                      : "bg-background border-gray-500",
                    isCurrent ? "bg-blue-500 border-blue-800" : "",
                    isCanceled ? "bg-red-500 border-red-500" : ""
                  )}
                />

                {/* Station info */}
                <div
                  className={cn(
                    "rounded-lg py-0.5 px-3 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer",
                    isCurrent ? "bg-blue-500/5" : "",
                    isCanceled ? "bg-red-500/5" : ""
                  )}
                  onClick={() => handleStopSelect(stop.stop?.id || "")}
                >
                  <div className="flex items-center">
                    <div className="flex flex-row items-center mr-2 sm:mr-4">
                      <div className="flex flex-col sm:mr-3 mr-1">
                        <p className="flex items-center whitespace-nowrap">
                          <span className="">
                            {moment(
                              stop.plannedDeparture || stop.plannedArrival
                            ).format("HH:mm") || "N/A"}
                          </span>
                        </p>
                        <p
                          className={`whitespace-nowrap ${getDelayColor(
                            stop.plannedDeparture
                              ? stop.departureDelay == undefined
                                ? null
                                : stop.departureDelay
                              : stop.arrivalDelay == undefined
                              ? null
                              : stop.arrivalDelay
                          )}`}
                        >
                          {stop.departure || stop.arrival ? moment(stop.departure || stop.arrival).format(
                            "HH:mm"
                          ) : "N/A"}{" "}
                        </p>
                      </div>
                      <span
                        className={`whitespace-nowrap text-sm flex items-center ${getDelayColor(
                          stop.plannedDeparture
                            ? stop.departureDelay == undefined
                              ? null
                              : stop.departureDelay
                            : stop.arrivalDelay == undefined
                            ? null
                            : stop.arrivalDelay
                        )}`}
                      >
                        (+
                        {stop.plannedDeparture
                          ? (stop.departureDelay || 0) / 60 || 0
                          : (stop.arrivalDelay || 0) / 60 || 0}
                        <span className="sm:inline hidden">min</span>)
                      </span>
                    </div>

                    <div className="flex justify-between w-full items-center">
                      <div className="flex flex-col gap-1">
                        {/* Status messages (critical) */}
                        {statuses.map((remark) => (
                          <span
                            key={remark.text}
                            className="text-red-400 flex items-center gap-1 text-xs"
                          >
                            <Clock size={12} className="flex-shrink-0" />
                            <span>{remark.text}</span>
                          </span>
                        ))}

                        {/* Warnings */}
                        {warnings.map((remark) => (
                          <span
                            key={remark.text}
                            className="text-orange-400 flex items-center gap-1 text-xs"
                          >
                            <TriangleAlert
                              size={12}
                              className="flex-shrink-0"
                            />
                            <span>{remark.text}</span>
                          </span>
                        ))}

                        {/* Hints */}
                        {hints.map((remark) => (
                          <span
                            key={remark.text}
                            className="text-gray-400 flex items-center gap-1 text-xs"
                          >
                            <Info size={12} className="flex-shrink-0" />
                            <span>{remark.text}</span>
                          </span>
                        ))}

                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              "font-medium",
                              isCanceled ? "text-red-900 line-through" : ""
                            )}
                          >
                            {stop.stop?.name}
                          </p>
                        </div>
                      </div>
                      {/* Track information */}
                      <div className="whitespace-nowrap flex items-center gap-2 min-w-[80px] justify-end">
                        {stop.loadFactor && (
                          <LoadFactor loadFactor={stop.loadFactor} />
                        )}
                        <strong className="text-right w-8">
                          {stop.departurePlatform ||
                            stop.arrivalPlatform ||
                            "N/A"}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
