import {VendoJourneyT} from "@/types/vendo.ts";
import config from "@/lib/db-web-api/base.json";
import axios from "axios";
import {loadFactorToText} from "@/util";
import {getBrowserHeaders} from "@/util/request/vendo.ts";

export const getJourneyInfoVendo = async (
    hafasJourneyId: string,
): Promise<VendoJourneyT | null> => {
    const url = `${config["journey-vendo-base"]}/${encodeURIComponent(hafasJourneyId)}`;
    return axios
        .get(url, {
            headers: getBrowserHeaders("zuglauf"),
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