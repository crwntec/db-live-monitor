import { Stop } from "@/types/timetable";
import { Stop as JourneyStop } from "@/types/journey";
import moment from "moment-timezone";// This would be in lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hasLeft(item: Stop, lookBack: number) {
    const nowTimestamp = moment().tz("Europe/Berlin").valueOf();
    const time = moment(
      item.arrival ? item.arrival.timePredicted : item.departure?.timePredicted
    );
    return nowTimestamp > time.add(lookBack, "minutes").valueOf();
}

export function getTime(stop: Stop, usePredicted = false) {
  const departureTime = usePredicted
    ? stop.departure?.timePredicted
    : stop.departure?.time;
  const arrivalTime = usePredicted
    ? stop.arrival?.timePredicted
    : stop.arrival?.time;
  return (
    departureTime || arrivalTime || moment().tz("Europe/Berlin").toISOString()
  );
};
export function getTimeJourney(stop: JourneyStop, usePredicted = false) {
  if (!stop) return moment().tz("Europe/Berlin").toISOString();
  const departureTime = usePredicted
    ? stop.departureTime?.predicted
    : stop.departureTime?.target;
  const arrivalTime = usePredicted
    ? stop.arrivalTime?.predicted
    : stop.arrivalTime?.target;
  return (
    departureTime || arrivalTime || moment().tz("Europe/Berlin").toISOString()
  );
};