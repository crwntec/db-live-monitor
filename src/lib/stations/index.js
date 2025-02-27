import stationsData from '@/assets/data/stations.json'; // Import the JSON data

let stationsCache = null;

/**
 * Reads and returns station data from the imported JSON data with caching
 * @returns {Promise<Array>} Promise that resolves to array of station objects
 */
export async function readStations() {
    if (stationsCache) {
        return stationsCache;
    }

    try {
        // Use the imported data directly
        stationsCache = stationsData;
        return stationsCache;
    } catch (error) {
        console.error("Error reading stations:", error);
        return [];
    }
}

/**
 * Finds a station by its EVA ID
 * @param {string|number} evaId - The EVA ID to search for
 * @returns {Promise<Object|null>} Promise that resolves to station object or null if not found
 */
export async function findStationByEvaId(evaId) {
    const stations = await readStations();
    return stations.find((station) => station.eva == evaId) || null;
}

export async function findStationByDS100(ds100) {
    const stations = await readStations();
    return stations.find((station) => station.ds100 == ds100) || null;
}

export async function getStationRelevance(name) {
    const stations = await readStations();
    return stations.find((station)=>station.name==name)?.number_of_events || 0
}