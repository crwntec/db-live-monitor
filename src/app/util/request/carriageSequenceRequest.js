import axios from "axios";

/**
 * Fetches carriage sequence data from Deutsche Bahn API
 * @param {Object} params Request parameters
 * @param {string} params.category Train category (e.g., 'ICE')
 * @param {string} params.date Date in YYYY-MM-DD format
 * @param {string} params.evaNumber Station EVA number
 * @param {string} params.number Train number
 * @param {string} params.time ISO timestamp
 * @returns {Promise<{
 *   departureID: string,           // Unique departure identifier
 *   departurePlatform: string,     // Actual departure platform
 *   departurePlatformSchedule: string, // Scheduled departure platform
 *   groups: Array<{               // Train composition groups
 *     name: string,               // Group name (e.g., "ICE9500")
 *     transport: {                // Transport information
 *       category: string,         // Train category (e.g., "ICE")
 *       destination: {
 *         name: string            // Final destination
 *       },
 *       journeyID: string,        // Unique journey identifier
 *       line: string,             // Line number/name
 *       number: number,           // Train number
 *       type: string              // Train type (e.g., "HIGH_SPEED_TRAIN")
 *     },
 *     vehicles: Array<{           // Array of carriages
 *       amenities: Array<{        // Available amenities
 *         amount: number,         // Quantity available
 *         status: string,         // Status (e.g., "AVAILABLE", "UNDEFINED")
 *         type: string            // Amenity type (e.g., "BIKE_SPACE", "AIR_CONDITION")
 *       }>,
 *       orientation: string,      // Carriage orientation ("FORWARDS" or "BACKWARDS")
 *       platformPosition: {       // Position on platform
 *         start: number,          // Start position in meters
 *         end: number,           // End position in meters
 *         sector: string         // Platform sector
 *       },
 *       status: string,          // Carriage status (e.g., "OPEN")
 *       type: {                  // Carriage type information
 *         category: string,      // Category (e.g., "CONTROLCAR_FIRST_CLASS")
 *         constructionType: string, // Construction type code
 *         hasEconomyClass: boolean,
 *         hasFirstClass: boolean
 *       },
 *       vehicleID: string,       // Unique vehicle identifier
 *       wagonIdentificationNumber: number // Wagon number
 *     }>
 *   }>,
 *   journeyID: string,           // Journey identifier
 *   platform: {                  // Platform details
 *     end: number,              // Platform end position
 *     name: string,             // Platform number
 *     sectors: Array<{          // Platform sectors
 *       name: string,           // Sector name
 *       start: number,          // Sector start position
 *       end: number,            // Sector end position
 *       cubePosition: number    // Reference position
 *     }>,
 *     start: number             // Platform start position
 *   },
 *   sequenceStatus: string      // Status of sequence (e.g., "DIFFERS_FROM_SCHEDULE")
 * }>}
 */
export const getCarriageSequence = async ({
  category,
  date,
  evaNumber,
  number,
  time
}) => {
  const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `https://www.bahn.de/web/api/reisebegleitung/wagenreihung/vehicle-sequence`,
    params: {
      category,
      date,
      evaNumber,
      number,
      time
    }
  };

  try {
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    if (error.response.status == 500) {
      return null;
    }
    console.error('Error fetching carriage sequence:', error);
    throw error;
  }
};

