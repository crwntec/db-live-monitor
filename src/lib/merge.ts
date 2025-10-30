import { Trip, StopOver } from "hafas-client";
import { VendoJourneyT, HaltT } from "@/types/vendo";
import moment from "moment";

// Extended StopOver type to include loadFactor
interface ExtendedStopOver extends StopOver {
  loadFactor?: string;
}

function mergeStopRemarks(vendoStop: HaltT, hafasStop: StopOver) {
  const combinedRemarks = [
    ...(vendoStop.himNotizen
      ?.filter((n) => n.text)
      .map((note) => ({
        type: "warning" as const,
        code: note.ueberschrift,
        text: note.text || "",
      })) || []),
    ...(vendoStop.echtzeitNotizen
      ?.filter((n) => n.text)
      .map((note) => ({
        type: "status" as const,
        code: null,
        text: note.text || "",
      })) || []),
    ...(vendoStop.attributNotizen
      ?.filter((n) => n.text)
      .map((note) => ({
        type: "hint" as const,
        code: note.key,
        text: note.text || "",
      })) || []),
    ...(vendoStop.serviceNotiz?.text
      ? [
          {
            type: "hint" as const,
            code: vendoStop.serviceNotiz.key,
            text: vendoStop.serviceNotiz.text,
          },
        ]
      : []),
  ];
  hafasStop.remarks?.map((r) => {
    // Check if any remark with the same text already exists (regardless of type)
    const textExists = combinedRemarks.some((n) => n.text === r.text);

    if (!textExists) {
      if (r.type === "warning") {
        combinedRemarks.push({
          type: "warning",
          code: undefined,
          text: r.text || "",
        });
      } else if (r.type === "status") {
        combinedRemarks.push({
          type: "status",
          code: null,
          text: r.text || "",
        });
      } else if (r.type === "hint") {
        combinedRemarks.push({
          type: "hint",
          code: r.code,
          text: r.text || "",
        });
      }
    }
  });

  return combinedRemarks;
}
function mergeJourneyRemarks(vendoJourney: VendoJourneyT, hafasTrip: Trip) {
   const combinedRemarks = [
    ...(vendoJourney.himNotizen
      ?.filter((n) => n.text)
      .map((note) => ({
        type: "warning" as const,
        text: note.text || "",
      })) || []),
    ...(vendoJourney.echtzeitNotizen
      ?.filter((n) => n.text)
      .map((note) => ({
        type: "status" as const,
        text: note.text || "",
      })) || []),
    ...(vendoJourney.attributNotizen
      ?.filter((n) => n.text)
      .map((note) => ({
        type: "hint" as const,
        code: note.key,
        text: note.key == "CK" ? "Komfort Check-In verfügbar" : note.text || "",
      })) || []),
  ];
  hafasTrip.remarks?.map((r) => {
    // Check if any remark with the same text already exists (regardless of type)
    const textExists = combinedRemarks.some(
      (n) =>
        r.text && n.text.replace(/\s/g, "") === r.text.replace(/\s/g, "")
    );

    if (!textExists) {
      if (r.type === "warning") {
        combinedRemarks.push({
          type: "warning",
          text: r.text || "",
        });
      } else if (r.type === "status") {
        combinedRemarks.push({
          type: "status",
          text: r.text || "",
        });
      } else if (r.type === "hint") {
        if (r.code == 'CK') return
        combinedRemarks.push({
          type: "hint",
          code: r.code,
          text: r.text || "",
        });
      }
    }
  });

  return combinedRemarks;
}

function mergeHafasVendo(
    vendoJourney: VendoJourneyT | null,
    hafasTrip: Trip | null
): Trip | null {
    // If both are null, nothing to merge
    if (!vendoJourney && !hafasTrip) return null;

    // If only Vendo exists, we cannot construct a full Trip (lacks origin/destination, line, etc.)
    // So we must rely on Hafas as the base structure
    if (!hafasTrip) {
        // Optional: log warning or throw if Vendo-only is not supported
        return null; // or consider creating a minimal Trip from Vendo if needed
    }

    // Now we know hafasTrip is not null
    const trip = hafasTrip;

    // Helper: safely find Vendo stop by EVA number (only if vendoJourney exists)
    const findVendoStop = (stopId: string | undefined): HaltT | undefined => {
        if (!vendoJourney || !stopId || !vendoJourney.stops) return undefined;
        return vendoJourney.stops.find((s) => s?.ort?.evaNr === stopId);
    };

    const mergeStopOver = (hafasStop: StopOver): ExtendedStopOver => {
        const vendoStop = findVendoStop(hafasStop.stop?.id);
        if (!vendoStop) return hafasStop;

        const vendoPlannedArrival = vendoStop.ankunftsDatum
            ? moment(vendoStop.ankunftsDatum).toISOString()
            : undefined;
        const vendoPlannedDeparture = vendoStop.abgangsDatum
            ? moment(vendoStop.abgangsDatum).toISOString()
            : undefined;
        const vendoActualArrival = vendoStop.ezAnkunftsDatum
            ? moment(vendoStop.ezAnkunftsDatum).toISOString()
            : undefined;
        const vendoActualDeparture = vendoStop.ezAbgangsDatum
            ? moment(vendoStop.ezAbgangsDatum).toISOString()
            : undefined;

        const arrivalDelay =
            vendoActualArrival && vendoPlannedArrival
                ? moment(vendoActualArrival).diff(moment(vendoPlannedArrival), 'seconds')
                : hafasStop.arrivalDelay ?? undefined;

        const departureDelay =
            vendoActualDeparture && vendoPlannedDeparture
                ? moment(vendoActualDeparture).diff(moment(vendoPlannedDeparture), 'seconds')
                : hafasStop.departureDelay ?? undefined;

        const combinedRemarks = mergeStopRemarks(vendoStop, hafasStop);

        return {
            ...hafasStop,
            plannedArrival: vendoPlannedArrival || hafasStop.plannedArrival,
            plannedDeparture: vendoPlannedDeparture || hafasStop.plannedDeparture,
            arrival: vendoActualArrival || hafasStop.arrival,
            departure: vendoActualDeparture || hafasStop.departure,
            arrivalDelay: arrivalDelay ?? hafasStop.arrivalDelay,
            departureDelay: departureDelay ?? hafasStop.departureDelay,
            arrivalPlatform:
                vendoStop.ezGleis || vendoStop.gleis || hafasStop.arrivalPlatform,
            departurePlatform:
                vendoStop.ezGleis || vendoStop.gleis || hafasStop.departurePlatform,
            plannedArrivalPlatform:
                vendoStop.gleis || hafasStop.plannedArrivalPlatform,
            plannedDeparturePlatform:
                vendoStop.gleis || hafasStop.plannedDeparturePlatform,
            cancelled:
                combinedRemarks.some((r) => r.text?.includes('entfällt')) ||
                (hafasStop.cancelled && !vendoActualArrival && !vendoActualDeparture),
            loadFactor: vendoStop.loadFactor,
            remarks: combinedRemarks.length > 0 ? combinedRemarks : hafasStop.remarks,
        };
    };

    const mergedStopovers = trip.stopovers?.map(mergeStopOver) ?? [];

    // Trip-level Vendo data (only if available)
    const firstVendoStop = vendoJourney?.stops?.[0];
    const lastVendoStop = vendoJourney?.stops?.[vendoJourney.stops.length - 1];

    const vendoOriginPlannedDeparture = firstVendoStop?.abgangsDatum
        ? moment(firstVendoStop.abgangsDatum).toISOString()
        : undefined;
    const vendoOriginActualDeparture = firstVendoStop?.ezAbgangsDatum
        ? moment(firstVendoStop.ezAbgangsDatum).toISOString()
        : undefined;
    const vendoDestinationPlannedArrival = lastVendoStop?.ankunftsDatum
        ? moment(lastVendoStop.ankunftsDatum).toISOString()
        : undefined;
    const vendoDestinationActualArrival = lastVendoStop?.ezAnkunftsDatum
        ? moment(lastVendoStop.ezAnkunftsDatum).toISOString()
        : undefined;

    const tripDepartureDelay =
        vendoOriginActualDeparture && vendoOriginPlannedDeparture
            ? moment(vendoOriginActualDeparture).diff(
                moment(vendoOriginPlannedDeparture),
                'seconds'
            )
            : trip.departureDelay;

    const tripArrivalDelay =
        vendoDestinationActualArrival && vendoDestinationPlannedArrival
            ? moment(vendoDestinationActualArrival).diff(
                moment(vendoDestinationPlannedArrival),
                'seconds'
            )
            : trip.arrivalDelay;

    const mergedRemarks = vendoJourney
        ? mergeJourneyRemarks(vendoJourney, trip)
        : trip.remarks ?? [];

    return {
        ...trip,
        plannedDeparture: vendoOriginPlannedDeparture || trip.plannedDeparture,
        plannedArrival: vendoDestinationPlannedArrival || trip.plannedArrival,
        departure: vendoOriginActualDeparture || trip.departure,
        arrival: vendoDestinationActualArrival || trip.arrival,
        departureDelay: tripDepartureDelay ?? trip.departureDelay,
        arrivalDelay: tripArrivalDelay ?? trip.arrivalDelay,
        departurePlatform:
            firstVendoStop?.ezGleis ||
            firstVendoStop?.gleis ||
            trip.departurePlatform,
        arrivalPlatform:
            lastVendoStop?.ezGleis ||
            lastVendoStop?.gleis ||
            trip.arrivalPlatform,
        plannedDeparturePlatform:
            firstVendoStop?.gleis || trip.plannedDeparturePlatform,
        plannedArrivalPlatform:
            lastVendoStop?.gleis || trip.plannedArrivalPlatform,
        direction: vendoJourney?.richtung || trip.direction,
        // Keep Hafas cancellation as primary (Vendo doesn't have explicit field)
        cancelled: trip.cancelled,
        stopovers: mergedStopovers,
        remarks: mergedRemarks.length > 0 ? mergedRemarks : trip.remarks,
    };
}

export default mergeHafasVendo;
