import axios from "axios";
import config from "./base.json";
import { JourneyT } from "@/types/journey";
import { loadFactorToText } from "@/util";
import { VendoJourneyT } from "@/types/vendo";
import { v4 as uuidv4 } from "uuid";

const randomHexString = (length: number): string =>
  [...Array(length)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join("");

const createRandomUserAgent = (): string => {
  let ua =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36";
  const randomPart = randomHexString(16);
  ua = ua.replace(
    "115.0.0.0",
    `115.0.${randomHexString(4)}.${randomHexString(2)}`,
  );
  return ua + ` UniqueId/${randomPart}`;
};
const getBrowserHeaders = () => ({
  Accept: "application/x.db.vendo.mob.zuglauf.v2+json",
  "Content-Type": "application/x.db.vendo.mob.zuglauf.v2+json",
  "Accept-Encoding": "gzip, deflate, br",
  "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
  Referer: "https://www.bahn.de/",
  Origin: "https://www.bahn.de",
  "User-Agent": createRandomUserAgent(),
  "X-Correlation-ID": uuidv4() + "_" + uuidv4(),
});

export const getJourneyInfoRegio = async (
  journeyID: string,
): Promise<JourneyT | null> => {
  return axios
    .get(`${config["journey-regio-base"]}/${journeyID}`, {})
    .then((response) => {
      return {
        ...response.data,
        stops: response.data.stops.map((stop: any) => ({
          ...stop,
          loadFactor: stop.occupancy?.economyClass.toLowerCase(),
        })),
      };
    })
    .catch((_) => null);
};

export const getJourneyInfoVendo = async (
  hafasJourneyId: string,
): Promise<VendoJourneyT | null> => {
  const url = `${config["journey-vendo-base"]}/${encodeURIComponent(hafasJourneyId)}`;
  return axios
    .get(url, {
      headers: getBrowserHeaders(),
      timeout: 10000,
    })
    .then((response) => {
      return {
        ...response.data,
        stops: response.data.halte.map((stop: any) => {
          const auslastungsInfos = stop.auslastungsInfos;
          const info =
            Array.isArray(auslastungsInfos) && auslastungsInfos.length > 0
              ? (auslastungsInfos[1] ?? auslastungsInfos[0])
              : null;

          let loadFactor = "no-info";

          if (info) {
            if (
              info.anzeigeTextKurz === "Keine Auslastungsinformation verfügbar"
            ) {
              loadFactor = "no-info";
            } else if (typeof info.stufe !== "undefined") {
              loadFactor = loadFactorToText(info.stufe, false);
            }
          }

          return {
            ...stop,
            loadFactor,
          };
        }),
      };
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
};
