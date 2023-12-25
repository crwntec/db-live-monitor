export const getTrip = async (cachedHafas, tripId) => {
  const trip = await cachedHafas.trip(tripId, {
    onlyCurrentlyRunning: false,
    polyline: true,
    language: "de",
  });
  return trip.trip;
}