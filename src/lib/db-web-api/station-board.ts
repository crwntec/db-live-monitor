import axios from "axios";
import config from "./base.json";
import { WebAPIResult } from "@/types/timetable";

type TimeFrame = { start: string; end: string };

type ApiResponse = Promise<WebAPIResult>;
const COMMON_PARAMS = {
  modeOfTransport:
    "HIGH_SPEED_TRAIN,REGIONAL_TRAIN,CITY_TRAIN,INTER_REGIONAL_TRAIN,INTERCITY_TRAIN",
  occupancy: true,
  expandTimeFrame: "TIME_END",
};

const fetchBoardData = async (
  type: "departure" | "arrival",
  stationEva: string,
  timeFrame: TimeFrame
): ApiResponse => {
  try {
    const response = await axios.get(`${config["board-base"]}/${type}/${stationEva}`, {
      params: {
        ...COMMON_PARAMS,
        timeStart: timeFrame.start,
        timeEnd: timeFrame.end,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${type} data:`, error);
    throw error;
  }
};

export const departures = (
  stationEva: string,
  timeFrame: TimeFrame
): ApiResponse => fetchBoardData("departure", stationEva, timeFrame);

export const arrivals = (
  stationEva: string,
  timeFrame: TimeFrame
): ApiResponse => fetchBoardData("arrival", stationEva, timeFrame);
