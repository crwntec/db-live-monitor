"use client";

import { useState, useEffect } from "react";
import { CircleAlert } from "lucide-react";
import moment from "moment";
import { getDelayColor } from "@/util/colors";
import { cn } from "@/util";
import { Stop } from "@/types/journey";

export default function StopsContainer({ stops }: { stops: Stop[] }) {
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (stops.length < 2) return;

    const firstStop = stops[0];
    const lastStop = stops[stops.length - 1];

    const startTime = new Date(
      firstStop.departureTime?.predicted ||
        firstStop.departureTime?.target ||
        firstStop.arrivalTime?.target ||
        0
    ).getTime();
    const endTime = new Date(
      lastStop.arrivalTime?.predicted ||
        lastStop.arrivalTime?.target ||
        lastStop.departureTime?.target ||
        0
    ).getTime();
    const now = currentTime.getTime();

    if (now < startTime) {
      setProgress(0);
    } else if (now > endTime) {
      setProgress(100);
    } else {
      const totalDuration = endTime - startTime;
      const elapsed = now - startTime;
      setProgress((elapsed / totalDuration) * 100);
    }
  }, [currentTime, stops]);

  const isCurrentStop = (stop: Stop, index: number) => {
    const arrivalTime = new Date(
      stop.arrivalTime?.predicted || stop.arrivalTime?.target || 0
    ).getTime();
    const departureTime = new Date(
      stop.departureTime?.predicted || stop.departureTime?.target || 0
    ).getTime();
    const now = currentTime.getTime();

    if (index === 0 && departureTime) {
      return now <= departureTime;
    }

    if (index === stops.length - 1 && arrivalTime) {
      return now >= arrivalTime;
    }

    if (arrivalTime && departureTime) {
      return now >= arrivalTime && now <= departureTime;
    }

    return (
      (arrivalTime && now >= arrivalTime) ||
      (departureTime && now <= departureTime)
    );
  };

  const isCompletedStop = (stop: Stop, index: number) => {
    if (index === stops.length - 1) {
      const arrivalTime = new Date(
        stop.arrivalTime?.predicted || stop.arrivalTime?.target || 0
      ).getTime();
      return currentTime.getTime() > arrivalTime;
    }

    const departureTime = new Date(
      stop.departureTime?.predicted || stop.departureTime?.target || 0
    ).getTime();
    return currentTime.getTime() > departureTime;
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
          style={{ height: `${progress}%` }}
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
                    isCurrent ? "ring-2 ring-blue-500 ring-offset-1" : "",
                    isCanceled ? "bg-red-500 border-red-500" : ""
                  )}
                />

                {/* Station info */}
                <div
                  className={cn(
                    "rounded-lg",
                    isCurrent ? "bg-blue-500/5" : "",
                    isCanceled ? "bg-red-50" : ""
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
