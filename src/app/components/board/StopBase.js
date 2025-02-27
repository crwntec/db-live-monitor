"use client";
import { v4 as uuidv4 } from "uuid";
import MessageContainer from "./MessageContainer";
import LineContainer from "./LineContainer";
import TimeContainer from "./TimeContainer";
import PathContainer from "./PathContainer";
import WingIndicator from "./WingIndicator";
import { useRouter } from "next/navigation";
export default function StopBase({ stop, stopGroup, hasLeft, index }) {
  const router = useRouter();
  return (
    <div
      className="flex flex-col gap-2 px-3 py-2"
      key={stop.train.id + uuidv4()}
    >
      {stop.delayMessages?.length == 0 && stop.qualityChanges?.length == 0 && (
        <PathContainer
          path={stop.departure ? stop.departure.path : stop.arrival.path}
        />
      )}
      <MessageContainer stop={stop} />
      <div
        onClick={() => stop.train.journeyId ? router.push(`/journey/${stop.train.journeyId}`) : {}}
        className={`hover:cursor-pointer flex items-center justify-between`}
      >
        <div className="flex items-center gap-2">
          {stopGroup.length > 1 && <WingIndicator index={index} />}
          <LineContainer train={stop.train} />
          <span
            className={` ${hasLeft ? "line-through" : ""} ${
              stop.canceled ? "line-through text-red-800" : ""
            } ${stop.departure?.path && !stop.departure?.destination ? "text-red-500" : ""}`}
          >
            {stop.departure && stop.departure.destination
              ? `Nach ${stop.departure.destination.name}`
              : `Von ${stop.arrival.origin.name}`}
          </span>
        </div>
        <div className="flex flex-col md:flex-row lg:flex-col gap-2">
          <div className="flex items-center justify-between w-full">
            <TimeContainer
              time={stop.departure && stop.departure.destination ? stop.departure : stop.arrival}
              canceled={stop.canceled}
            />
            <div className="flex justify-end gap-1 sm:w-16 w-full">
              <span className={`${stop.arrival.platform === stop.arrival.platformPredicted ? "text-green-500" : "line-through text-red-500"}`}>
                {stop.arrival.platform}
              </span>
              <span className="">
                {stop.arrival.platform === stop.arrival.platformPredicted ? "" : stop.arrival.platformPredicted}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
