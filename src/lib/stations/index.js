let stationsCache = null;

/**
 * Reads and returns station data from /public/stations.json with caching
 * @returns {Promise<Array>} Promise that resolves to array of station objects
 */
export async function readStations() {
    if (stationsCache) {
        return stationsCache;
    }

    try {
        const response = await fetch('/data/stations.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch stations: ${response.status}`);
        }
        
        stationsCache = await response.json();
        return stationsCache;
    } catch (error) {
        console.error('Error reading stations:', error);
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
    return stations.find(station => station.eva == evaId) || null;
}


