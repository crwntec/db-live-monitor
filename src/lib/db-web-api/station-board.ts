import axios from "axios";
import config from "./base.json";
import { WebAPIResult } from "@/types/timetable";

type TimeFrame = { start: string; end: string };

type ApiResponse = Promise<WebAPIResult>;
const COMMON_PARAMS = {
  filterTransports:
    "HIGH_SPEED_TRAIN,REGIONAL_TRAIN,CITY_TRAIN,INTER_REGIONAL_TRAIN,INTERCITY_TRAIN",
  sortBy: "TIME_SCHEDULE",
  includeStationGroup: true,
};

const fetchBoardData = async (
  type: "departures" | "arrivals",
  stationEva: string,
  timeFrame: TimeFrame,
): ApiResponse => {
  try {
    const response = await axios.get(
      `${config["board-base"]}/${type}/${stationEva}`,
      {
        headers: {
          "DB-API-KEY": "3e2b49289f38c2fb8e8886d23fc0f830",
          "DB-CLIENT-ID": "32f5e78c1dd72544b307665dea38b901",
        },
        params: {
          ...COMMON_PARAMS,
          timeStart: timeFrame.start,
          timeEnd: timeFrame.end,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${type} data:`, error);
    throw error;
  }
};

export const departures = (
  stationEva: string,
  timeFrame: TimeFrame,
): ApiResponse => fetchBoardData("departures", stationEva, timeFrame);

export const arrivals = (
  stationEva: string,
  timeFrame: TimeFrame,
): ApiResponse => fetchBoardData("arrivals", stationEva, timeFrame);
