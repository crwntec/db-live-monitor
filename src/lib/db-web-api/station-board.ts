import axios from "axios";
import config from "./base.json";
import {WebAPIResult} from "@/types/timetable";
import {getBrowserHeaders} from "@/util/request/vendo.ts";
import {BahnhofstafelResponseT} from "@/types/vendo.ts";

type TimeFrame = { start: string; end: string };

type ApiResponse = Promise<WebAPIResult>;
const COMMON_PARAMS = {
    filterTransports:
        "HIGH_SPEED_TRAIN,REGIONAL_TRAIN,CITY_TRAIN,INTER_REGIONAL_TRAIN,INTERCITY_TRAIN",
    sortBy: "TIME_SCHEDULE",
    includeStationGroup: true,
};

export const fetchVendoBoardData = async (type: "abfahrt" | "ankunft", stationEva: string, time: string, date: string): Promise<BahnhofstafelResponseT | null> => {
    const url = `${config["board-vendo-base"]}/${type}`;
    const body = {
        "anfragezeit": time,
        "datum": date,
        "verkehrsmittel": [
            "HOCHGESCHWINDIGKEITSZUEGE",
            "INTERCITYUNDEUROCITYZUEGE",
            "INTERREGIOUNDSCHNELLZUEGE",
            "NAHVERKEHRSONSTIGEZUEGE",
            "SBAHNEN",
            "BUSSE",
            "SCHIFFE",
            "UBAHN",
            "STRASSENBAHN",
            "ANRUFPFLICHTIGEVERKEHRE"
        ],
        "ursprungsBahnhofId": `A=1@L=${stationEva}@`
    }
    return axios
        .post(url, body, {
            headers: getBrowserHeaders("bahnhofstafeln"),
            timeout: 10000,
        })
        .then((response) => {
           return response.data;
        })
        .catch((e) => {
            if (e.response?.status === 422) return null;
            console.error(
                "API Error (Vendo):",
                e.response?.status,
                e.response?.data,
                url,
                e,
            );
            return null;
        });
}

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
