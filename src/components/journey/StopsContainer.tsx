"use client";
import { Flowbite, Timeline } from "flowbite-react";
import { CircleAlert } from "lucide-react";
import moment from "moment";
import { getDelayColor } from "@/util/colors";
import { Stop } from "@/types/journey";

export default function StopsContainer({ stops } : { stops: Stop[]}) {
  //TODO: Add live progress
  // console.log(stops)
  let seenMessages = new Map();
  return (
    <div className="space-y-2">
      <Flowbite>
        <Timeline>
          {stops.map((stop) => (
            <Timeline.Item key={stop.station.evaNo}>
              <Timeline.Point />
              <Timeline.Content className="flex items-center">
                <div className="flex flex-col min-w-[60px]">
                  <p className="flex items-center whitespace-nowrap">
                    <span className="mr-2">
                      {moment(
                        stop.departureTime?.target || stop.arrivalTime?.target
                      ).format("HH:mm") || "N/A"}
                    </span>
                  </p>
                  <p
                    className={`whitespace-nowrap ${getDelayColor(
                      stop.departureTime ? stop.departureTime.diff : stop.arrivalTime?.diff || null
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
                      if (seenMessages.has(message.code)) return;
                      seenMessages.set(message.code, message.text);
                      return (
                        <span key={message.code} className="text-red-500 flex items-center gap-1">
                          <CircleAlert color="#F05252" size={13} />
                          <span className="">{message.text}</span>
                        </span>
                      );
                    })}
                    <p
                      className={`font-medium whitespace-nowrap ${
                        stop.status == "Canceled"
                          ? "text-red-900 line-through"
                          : ""
                      }`}
                    >
                      {stop.station.name}
                    </p>
                  </div>
                  {/* TODO: Add occupancy information */}
                  <p className="whitespace-nowrap">
                    <strong>{stop.track.prediction || "N/A"}</strong>
                  </p>
                </div>
              </Timeline.Content>
            </Timeline.Item>
          ))}
        </Timeline>
      </Flowbite>
    </div>
  );
}
