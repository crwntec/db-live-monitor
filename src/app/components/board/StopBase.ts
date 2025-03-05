"use client";
import { v4 as uuidv4 } from "uuid";
import MessageContainer from "./MessageContainer";
import LineContainer from "./LineContainer";
import TimeContainer from "./TimeContainer";
import PathContainer from "./PathContainer";
import WingIndicator from "./WingIndicator";
import Link from "next/link";

import { usePathname } from 'next/navigation'

export default function StopBase({ stop, stopGroup, hasLeft, index }) {
  const isWinged = stopGroup.length > 1;
  const hasWingInfo = stop.wing != null;
  
  const pathname = usePathname();

  // Only assign wing if stopGroup has more than one item
  const wing = stopGroup.length > 1 ? stopGroup[index == 0 ? 1 : 0] : null;

  const constructName = (train) => train ?
    `${train.category + " " + train.lineName}(${train.no})` : '';

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
      <Link
        href={
          stop.train.journeyId
            ? `/journey/${stop.train.journeyId}?referringEva=${pathname.split('/')[2]}&wingId=${
                wing ? wing.train.journeyId : ""
              }${
                isWinged
                  ? `&wingStart=${
                      hasWingInfo
                        ? stop.wing?.start.station
                        : wing?.wing.start.station
                    }&wingDest=${
                      hasWingInfo
                        ? stop.wing?.end.station
                        : wing?.wing.end.station
                    }`
                  : ""
              }&wingName=${wing ? constructName(wing.train) : ''}`
            : "#"
        }
        className={`hover:cursor-pointer flex items-center justify-between`}
      >
        <div className="flex items-center gap-2">
          {stopGroup.length > 1 && <WingIndicator index={index} />}
          <LineContainer train={stop.train} />
          <span
            className={` ${hasLeft ? "line-through" : ""} ${
              stop.canceled ? "line-through text-red-800" : ""
            } ${
              stop.departure?.path && !stop.departure?.destination
                ? "text-red-500"
                : ""
            }`}
          >
            {stop.departure && stop.departure.destination
              ? `Nach ${stop.departure.destination.name}`
              : `Von ${stop.arrival.origin.name}`}
          </span>
        </div>
        <div className="flex flex-col md:flex-row lg:flex-col gap-2">
          <div className="flex items-center justify-between w-full">
            <TimeContainer
              time={
                stop.departure && stop.departure.destination
                  ? stop.departure
                  : stop.arrival
              }
              canceled={stop.canceled}
            />
            <div className="flex justify-end gap-1 w-14">
              <span
                className={`${
                  stop.arrival?.platform === stop.arrival?.platformPredicted
                    ? "text-green-500"
                    : "line-through text-red-500"
                }`}
              >
                {stop.arrival?.platform || stop.departure.platform}
              </span>
              <span className="">
                {stop.arrival?.platform === stop.arrival?.platformPredicted
                  ? ""
                  : stop.arrival?.platformPredicted}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
