"use client";

import { useState, useEffect } from "react";
import { CircleAlert } from "lucide-react";
import moment from "moment";
import { getDelayColor } from "@/util/colors";
import { cn, getTimeJourney } from "@/util";
import { Stop } from "@/types/journey";

const calculateProgress = (
  stops: Stop[],
  currentTime: moment.Moment
): number => {
  if (stops.length < 2) return 0;
  const firstStop = stops[0];
  if (!firstStop) return 0;
  const lastStop = stops[stops.length - 1];

  const startTime = moment(getTimeJourney(firstStop, true)).valueOf();
  const endTime = moment(getTimeJourney(lastStop, true)).valueOf();

  const now = currentTime.valueOf();

  if (now < startTime) return 0;
  if (now > endTime) return 100;

  return ((now - startTime) / (endTime - startTime)) * 100;
};

export default function StopsContainer({ stops }: { stops: Stop[] }) {
  const [progress, setProgress] = useState(0);
  const [heigthProgress, setHeightProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(
    moment().tz("Europe/Berlin").add(0, "minutes")
  );

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

  const calculateAndSetProgress = () => {
    if (stops.length < 2) return 0;

  const firstStop = stops[0];
  const lastStop = stops[stops.length - 1];

  const startTime = moment(getTimeJourney(firstStop, true)).valueOf();
  const endTime = moment(getTimeJourney(lastStop, true)).valueOf();
  const now = currentTime.valueOf();

  if (now <= startTime) return 0;
  if (now >= endTime) return 100;

  // Find the last completed stop and next stop
  let prevStop = firstStop;
  let nextStop = lastStop;
  let prevStopIndex = 0;
  let nextStopIndex = 0;
  for (let i = 1; i < stops.length; i++) {
    const stopTime = moment(getTimeJourney(stops[i], true)).valueOf();
    if (stopTime > now) {
      nextStop = stops[i];
      nextStopIndex = i;
      break;
    }
    prevStop = stops[i];
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

  const stopPositions = stops.map((_,index) =>(index/(stops.length - 1)*100));
  console.log(stopPositions)
  setHeightProgress(stopPositions[prevStopIndex] + (segmentProgress * (stopPositions[nextStopIndex] - stopPositions[prevStopIndex])));

  setProgress(overallProgress)
  };

  const isCurrentStop = (stop: Stop, index: number) => {
    const arrivalTime = moment(
      stop.arrivalTime?.predicted || stop.arrivalTime?.target || 0
    );
    const departureTime = moment(
      stop.departureTime?.predicted || stop.departureTime?.target || 0
    );

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

  const isCompletedStop = (stop: Stop, index: number) => {
    // Last stop is completed if we've arrived
    if (index === stops.length - 1) {
      const arrivalTime = moment(
        stop.arrivalTime?.predicted || stop.arrivalTime?.target
      );
      return arrivalTime.isValid() && currentTime.isAfter(arrivalTime);
    }

    // Other stops are completed if we've departed
    const departureTime = moment(
      stop.departureTime?.predicted || stop.departureTime?.target
    );
    return departureTime.isValid() && currentTime.isAfter(departureTime);
  };

  let seenMessages = new Map();

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
          <span>
            {moment(stops[0].departureTime?.predicted || 0).format("HH:mm")}
          </span>
          <span>{Math.round(progress)}%</span>
          <span>
            {moment(stops[stops.length - 1].arrivalTime?.predicted || 0).format(
              "HH:mm"
            )}
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
            const isCanceled = stop.status === "Canceled";

            return (
              <div key={stop.station.evaNo} className="relative pl-10">
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
                    "rounded-lg py-0.5 px-1",
                    isCurrent ? "bg-blue-500/5" : "",
                    isCanceled ? "bg-red-500/5" : ""
                  )}
                >
                  <div className="flex items-center">
                    <div className="flex flex-col min-w-[60px]">
                      <p className="flex items-center whitespace-nowrap">
                        <span className="mr-2">
                          {moment(
                            stop.departureTime?.target ||
                              stop.arrivalTime?.target
                          ).format("HH:mm") || "N/A"}
                        </span>
                      </p>
                      <p
                        className={`whitespace-nowrap ${getDelayColor(
                          stop.departureTime
                            ? stop.departureTime.diff
                            : stop.arrivalTime?.diff || null
                        )}`}
                      >
                        {moment(
                          stop.departureTime?.predicted ||
                            stop.arrivalTime?.predicted
                        ).format("HH:mm") || "N/A"}
                      </p>
                    </div>

                    <div className="flex justify-between w-full items-center">
                      <div className="flex flex-col">
                        {stop.messages.map((message) => {
                          if (seenMessages.has(message.code)) return null;
                          seenMessages.set(message.code, message.text);
                          return (
                            <span
                              key={message.code}
                              className="text-red-500 flex items-center gap-1"
                            >
                              <CircleAlert color="#F05252" size={13} />
                              <span className="">{message.text}</span>
                            </span>
                          );
                        })}
                        <p
                          className={cn(
                            "font-medium whitespace-nowrap",
                            isCanceled ? "text-red-900 line-through" : ""
                          )}
                        >
                          {stop.station.name}
                        </p>
                      </div>
                      {/* Track information */}
                      <p className="whitespace-nowrap">
                        <strong>{stop.track.prediction || "N/A"}</strong>
                      </p>
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
