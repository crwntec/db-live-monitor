import axios from "axios"
import config from "./base.json"

export const departures = (stationEva: string, timeFrame: { start: string, end: string }) => {
    return axios.get(config["base-url"] + "board/departure/" + stationEva, {
        params: {
            modeOfTransport: "HIGH_SPEED_TRAIN,REGIONAL_TRAIN,CITY_TRAIN,INTER_REGIONAL_TRAIN,INTERCITY_TRAIN",
            occupancy: true,
            timeStart: timeFrame.start,
            timeEnd: timeFrame.end,
            expandTimeFrame: "TIME_END",
        }
    }).then((response) => response.data);
}

export const arrivals = (stationEva: string, timeFrame: { start: string, end: string }) => {
    return axios.get(config["base-url"] + "board/arrival/" + stationEva, {
        params: {
            modeOfTransport: "HIGH_SPEED_TRAIN,REGIONAL_TRAIN,CITY_TRAIN,INTER_REGIONAL_TRAIN,INTERCITY_TRAIN",
            occupancy: true,
            timeStart: timeFrame.start,
            timeEnd: timeFrame.end,
            expandTimeFrame: "TIME_END",
        }
    }).then((response) => response.data);
}