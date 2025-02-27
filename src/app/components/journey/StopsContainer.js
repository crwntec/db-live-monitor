"use client";
import { Flowbite, Timeline } from "flowbite-react";
import moment from "moment";
import { getDelayColor } from "@/util/colors";

export default function StopsContainer({ stops }) {
  //TODO: Add live progress

  return (
        <div className="space-y-2">
          <Flowbite>
            <Timeline>
              {stops.map((stop) => (
                <Timeline.Item key={stop.station.evaNo}>
                  <Timeline.Point />
                  <Timeline.Content className="flex items-center">
                    <div className="flex flex-col">
                      <p className="flex items-center">
                        <span className="mr-2">
                          {moment(
                            stop.departureTime?.target || stop.arrivalTime?.target
                          ).format("HH:mm") || "N/A"}
                        </span>
                      </p>
                      <p
                        className={`${getDelayColor(
                          stop.departureTime?.diff || stop.arrivalTime?.diff
                        )}`}
                      >
                        {moment(
                          stop.departureTime?.predicted ||
                            stop.arrivalTime?.predicted
                        ).format("HH:mm") || "N/A"}
                      </p>
                    </div>
                    <div className="flex justify-between w-full">
                      <p className="font-medium">{stop.station.name}</p>
                      <p>
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
