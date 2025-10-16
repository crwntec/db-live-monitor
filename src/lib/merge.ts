import { Trip, StopOver } from "hafas-client";
import { VendoJourneyT, HaltT } from "@/types/vendo";
import moment from "moment";

// Extended StopOver type to include loadFactor
interface ExtendedStopOver extends StopOver {
  loadFactor?: string;
}

function mergeHafasVendo(
  vendoJourney: VendoJourneyT | null,
  hafasTrip: Trip,
): Trip {
  if (!vendoJourney) return hafasTrip;

  // Helper function to find matching Vendo stop by EVA number
  const findVendoStop = (stopId: string | undefined): HaltT | undefined => {
    if (!stopId) return undefined;
    return vendoJourney.stops?.find((s) => s?.ort?.evaNr === stopId);
  };

  // Helper function to merge a single stopover
  const mergeStopOver = (hafasStop: StopOver): ExtendedStopOver => {
    const vendoStop = findVendoStop(hafasStop.stop?.id);
    if (!vendoStop) return hafasStop;

    // Parse Vendo times
    // ankunftsDatum/abgangsDatum = planned times
    // ezAnkunftsDatum/ezAbgangsDatum = real-time/actual times (ez = Echtzeit)
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

    // Calculate delays in seconds from Vendo data
    const arrivalDelay =
      vendoActualArrival && vendoPlannedArrival
        ? moment(vendoActualArrival).diff(
            moment(vendoPlannedArrival),
            "seconds",
          )
        : hafasStop.arrivalDelay;
    const departureDelay =
      vendoActualDeparture && vendoPlannedDeparture
        ? moment(vendoActualDeparture).diff(
            moment(vendoPlannedDeparture),
            "seconds",
          )
        : hafasStop.departureDelay;

    // Combine remarks from both sources
    const combinedRemarks = [
      ...(hafasStop.remarks || []),
      ...(vendoStop.himNotizen
        ?.filter((n) => n.text)
        .map((note) => ({
          type: "warning" as const,
          code: note.key,
          text: note.text || "",
        })) || []),
      ...(vendoStop.echtzeitNotizen
        ?.filter((n) => n.text)
        .map((note) => ({
          type: "status" as const,
          code: note.key,
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

    return {
      ...hafasStop,
      // Trust Vendo planned times, fallback to Hafas
      plannedArrival: vendoPlannedArrival || hafasStop.plannedArrival,
      plannedDeparture: vendoPlannedDeparture || hafasStop.plannedDeparture,
      // Trust Vendo actual times, fallback to Hafas
      arrival: vendoActualArrival || hafasStop.arrival,
      departure: vendoActualDeparture || hafasStop.departure,
      // Use calculated delays from Vendo times
      arrivalDelay: arrivalDelay ?? hafasStop.arrivalDelay,
      departureDelay: departureDelay ?? hafasStop.departureDelay,
      // Trust Vendo platform (both actual and planned use same field)
      arrivalPlatform:
        vendoStop.ezGleis || vendoStop.gleis || hafasStop.arrivalPlatform,
      departurePlatform:
        vendoStop.ezGleis || vendoStop.gleis || hafasStop.departurePlatform,
      plannedArrivalPlatform:
        vendoStop.gleis || hafasStop.plannedArrivalPlatform,
      plannedDeparturePlatform:
        vendoStop.gleis || hafasStop.plannedDeparturePlatform,
      // Vendo doesn't have explicit cancellation field in HaltT
      cancelled:
        combinedRemarks.some((r) => r.text?.includes("entfällt")) ||
        hafasStop.cancelled,
      // Add Vendo load factor
      loadFactor: vendoStop.loadFactor,
      // Combine remarks from both sources
      remarks: combinedRemarks.length > 0 ? combinedRemarks : hafasStop.remarks,
    };
  };

  // Merge stopovers
  const mergedStopovers = hafasTrip.stopovers?.map(mergeStopOver);

  // Get first and last stop for trip-level data
  const firstVendoStop = vendoJourney.stops?.[0];
  const lastVendoStop = vendoJourney.stops?.[vendoJourney.stops.length - 1];

  // Parse trip-level Vendo times
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

  // Calculate trip-level delays from Vendo data
  const tripDepartureDelay =
    vendoOriginActualDeparture && vendoOriginPlannedDeparture
      ? moment(vendoOriginActualDeparture).diff(
          moment(vendoOriginPlannedDeparture),
          "seconds",
        )
      : hafasTrip.departureDelay;
  const tripArrivalDelay =
    vendoDestinationActualArrival && vendoDestinationPlannedArrival
      ? moment(vendoDestinationActualArrival).diff(
          moment(vendoDestinationPlannedArrival),
          "seconds",
        )
      : hafasTrip.arrivalDelay;

  // Merge trip-level remarks
  const mergedRemarks = [
    ...(hafasTrip.remarks || []),
    ...(vendoJourney.himNotizen
      ?.filter((n) => n.text)
      .map((note) => ({
        type: "warning" as const,
        code: note.key,
        text: note.text || "",
      })) || []),
    ...(vendoJourney.echtzeitNotizen
      ?.filter((n) => n.text)
      .map((note) => ({
        type: "status" as const,
        code: note.key,
        text: note.text || "",
      })) || []),
    ...(vendoJourney.attributNotizen
      ?.filter((n) => n.text)
      .map((note) => ({
        type: "hint" as const,
        code: note.key,
        text: note.text || "",
      })) || []),
  ];

  return {
    ...hafasTrip,
    // Trust Vendo planned times, fallback to Hafas
    plannedDeparture: vendoOriginPlannedDeparture || hafasTrip.plannedDeparture,
    plannedArrival: vendoDestinationPlannedArrival || hafasTrip.plannedArrival,
    // Trust Vendo actual times, fallback to Hafas
    departure: vendoOriginActualDeparture || hafasTrip.departure,
    arrival: vendoDestinationActualArrival || hafasTrip.arrival,
    // Trust Vendo delays
    departureDelay: tripDepartureDelay ?? hafasTrip.departureDelay,
    arrivalDelay: tripArrivalDelay ?? hafasTrip.arrivalDelay,
    // Trust Vendo platforms (with ezGleis as actual platform if available)
    departurePlatform:
      firstVendoStop?.ezGleis ||
      firstVendoStop?.gleis ||
      hafasTrip.departurePlatform,
    arrivalPlatform:
      lastVendoStop?.ezGleis ||
      lastVendoStop?.gleis ||
      hafasTrip.arrivalPlatform,
    plannedDeparturePlatform:
      firstVendoStop?.gleis || hafasTrip.plannedDeparturePlatform,
    plannedArrivalPlatform:
      lastVendoStop?.gleis || hafasTrip.plannedArrivalPlatform,
    // Trust Vendo direction
    direction: vendoJourney.richtung || hafasTrip.direction,
    // Keep Hafas cancellation status (Vendo HaltT doesn't have ausfall)
    cancelled: hafasTrip.cancelled,
    // Merge stopovers with Vendo data
    stopovers: mergedStopovers,
    // Combine remarks from both sources
    remarks: mergedRemarks.length > 0 ? mergedRemarks : hafasTrip.remarks,
  };
}

export default mergeHafasVendo;
