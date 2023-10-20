export const getCachedDepartures = async (cachedHafas, eva) => {
  const _dep = await cachedHafas.departures(eva, {
    remarks: true,
    when: new Date(Date.now()),
    duration: 120,
    products: {
      suburban: true,
      subway: false,
      tram: false,
      bus: true,
      ferry: false,
      express: false,
      regional: true,
    },
    results: 200,
    language: "de",
  });
  return _dep.departures
};
export const getCachedArrivals = async (cachedHafas, eva) => {
  const _arr = await cachedHafas.arrivals(eva, {
    remarks: true,
    when: new Date(Date.now()),
    duration: 120,
    products: {
      suburban: true,
      subway: false,
      tram: false,
      bus: true,
      ferry: false,
      express: false,
      regional: true,
    },
    results: 200,
    language: "de",
  });
  return _arr.arrivals;
};