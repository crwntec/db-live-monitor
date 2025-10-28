"use server";

import {
    createHafas,
    findTrips,
    tripInfo,
} from "@/lib/hafas";
import mergeHafasVendo from "@/lib/merge";
import { JourneyT } from "@/types/journey";
import { getCarriageSequence } from "@/util/request/carriageSequenceRequest";
import moment, { Moment } from "moment";
import { getJourneyInfoVendo } from "@/lib/db-web-api/journey-info";
import { fetchVendoBoardData } from "@/lib/db-web-api/station-board";
import { HafasClient } from "hafas-client";

// Helper: safe async wrapper that returns { data, error }
const safeAsync = async <T>(
    promise: Promise<T>,
    context: string
): Promise<{ data: T | null; error: string | null }> => {
    try {
        const data = await promise;
        return { data, error: null };
    } catch (err: any) {
        const message = err?.message || String(err) || "Unknown error";
        console.error(`[safeAsync] ${context} failed:`, message);
        return { data: null, error: `${context}: ${message}` };
    }
};

// Fetch Hafas and Vendo IDs in one go
const getHafasIds = async (
    onlyArrival: boolean,
    evaNo: string,
    mdate: Moment,
    trainName: string,
    lineName: string,
    trainNumber: string,
    hafasClient: HafasClient
): Promise<{ vendoId: string; hafasId: string; error?: string }> => {
    try {
        const [vendoBoardResult, tripsResult] = await Promise.all([
            safeAsync(
                fetchVendoBoardData(
                    onlyArrival ? "ankunft" : "abfahrt",
                    evaNo,
                    mdate.format("HH:mm"),
                    mdate.format("YYYY-MM-DD")
                ),
                "Vendo station board"
            ),
            safeAsync(
                findTrips(trainNumber, hafasClient, 1, ["80"], mdate.toDate()),
                "Hafas trip search"
            ),
        ]);

        if (vendoBoardResult.error && tripsResult.error) {
            return {
                vendoId: "",
                hafasId: "",
                error: `Both Vendo and Hafas failed: ${vendoBoardResult.error}; ${tripsResult.error}`,
            };
        }

        const vendoData =
            vendoBoardResult.data?.bahnhofstafelAbfahrtPositionen ||
            vendoBoardResult.data?.bahnhofstafelAnkunftPositionen ||
            [];

        const normalizedTrainName = trainName.replace(/\s+/g, "");
        const trip = vendoData.find((p) => {
            const normalizedId = p.zuglaufId.replace(/\s+/g, "");
            return normalizedId.includes(`ZB#${normalizedTrainName}`) || normalizedId.includes(`ZB#${lineName}`);
        });

        const vendoId = trip?.zuglaufId || "";
        const hafasId = tripsResult.data?.[0]?.id || "";

        return { vendoId, hafasId };
    } catch (err: any) {
        const msg = err?.message || "Unknown error in getHafasIds";
        console.error("[getHafasIds] Fatal error:", msg);
        return { vendoId: "", hafasId: "", error: msg };
    }
};

export const getVendoJourney = async (hafasJourneyId: string) => {
    if (!hafasJourneyId) return null;
    const res = await getJourneyInfoVendo(hafasJourneyId);
    return res || null;
};

export const getJourneyFromTrainNumber = async (
    trainName: string,
    lineName: string,
    trainNumber: string,
    evaNo: string,
    date: string,
    onlyArrival: boolean
): Promise<{ data: JourneyT | null; error?: string }> => {
    const mdate = moment(date);
    if (!mdate.isValid()) {
        return { data: null, error: "Invalid date format" };
    }

    const hafasClient = createHafas();

    // Step 1: Get IDs (Vendo + Hafas)
    const idResult = await getHafasIds(onlyArrival, evaNo, mdate, trainName, lineName, trainNumber, hafasClient);
    if (idResult.error) {
        return { data: null, error: idResult.error };
    }

    const { vendoId, hafasId } = idResult;

    // Step 2: Fetch Hafas trip, Vendo journey, and carriage sequence IN PARALLEL
    const [hafasTripResult, vendoJourneyResult, carriageSeqResult] = await Promise.all([
        safeAsync(tripInfo(hafasId, hafasClient), "Hafas trip details"),
        safeAsync(getVendoJourney(vendoId), "Vendo journey data"),
        safeAsync(
            getCarriageSequence({
                category: trainName.includes("ICE") ? "ICE" : "IC",
                date: mdate.format("YYYY-MM-DD"),
                evaNumber: evaNo,
                number: parseInt(trainNumber, 10),
                time: mdate.toDate(),
            }),
            "Carriage sequence"
        ),
    ]);

    // Even if some fail, we try to merge what we have
    const mergedTrip = mergeHafasVendo(vendoJourneyResult.data, hafasTripResult.data);

    // Construct final data object
    const data: JourneyT = {
        ...mergedTrip,
        id: mergedTrip?.id || "",
        hafasId: hafasId || "",
        vendoId: vendoId || "",
        polyline: mergedTrip?.polyline || undefined,
        remarks: mergedTrip?.remarks || [],
        carriageSequence: carriageSeqResult.data || undefined
    };

    // Collect non-fatal warnings (optional: log or include in response)
    const warnings: string[] = [];
    if (hafasTripResult.error) warnings.push(hafasTripResult.error);
    if (vendoJourneyResult.error) warnings.push(vendoJourneyResult.error);
    if (carriageSeqResult.error) warnings.push(carriageSeqResult.error);

    // If mergedTrip is null AND no useful data, return error
    if (!mergedTrip && !carriageSeqResult.data) {
        const allErrors = [hafasTripResult.error, vendoJourneyResult.error]
            .filter(Boolean)
            .join("; ");
        return {
            data: null,
            error: allErrors || "Failed to retrieve journey data from all sources",
        };
    }

    // Success: return data (with optional warnings in logs)
    if (warnings.length > 0) {
        console.warn(`[Journey ${trainName} ${trainNumber}] Partial data:`, warnings.join("; "));
    }

    return { data, error: undefined };
};