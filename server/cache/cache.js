let journeyCache = [];
let cacheEva;

export const getCache = () => {
  return journeyCache
};

export const updateCache = async (eva, hafasClient) => {
  if (cacheEva !== eva && eva) cacheEva = eva
  const arr = await hafasClient.arrivals(cacheEva.toString(), {
    remarks: true,
    duration: 180,
    products: {
      suburban: true,
      subway: false,
      tram: false,
      bus: true,
      ferry: false,
      express: false,
      regional: true,
    },
    language: "de",
  });
  const dep = await hafasClient.departures(cacheEva.toString(), {
    remarks: true,
    duration: 180,
    products: {
      suburban: true,
      subway: false,
      tram: false,
      bus: true,
      ferry: false,
      express: false,
      regional: true,
    },
    language: "de",
  });
  arr.arrivals.forEach(e=>journeyCache.push(e))
  dep.departures.forEach(e=>journeyCache.push(e))
};
