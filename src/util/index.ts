import { Stop } from "@/types/timetable";
import moment from "moment-timezone";// This would be in lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hasLeft(item: Stop, lookBack = 10) {
    const nowTimestamp = moment().valueOf();
    const time = moment(
      item.arrival ? item.arrival.timePredicted : item.departure?.timePredicted
    );
    return nowTimestamp > time.add(lookBack, "minutes").valueOf();
}