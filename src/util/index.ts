import { Stop } from "@/types/timetable";
import moment from "moment-timezone";

export function hasLeft(item: Stop, lookBack = 10) {
    const nowTimestamp = moment().valueOf();
    const time = moment(
      item.arrival ? item.arrival.timePredicted : item.departure?.timePredicted
    );
    return nowTimestamp > time.add(lookBack, "minutes").valueOf();
}