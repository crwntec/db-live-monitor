import axios from "axios";
import config from "./base.json"

/**
 * Fetches detailed information about a specific train journey
 * @param {string} journeyID - The unique identifier for the journey (e.g. "20250207-aad10b71-21b0-3836-bfa8-5808a3737536")
 * @returns {Promise<{
 *   name: string,                   // Train name/number (e.g. "S 8")
 *   no: number,                     // Train number
 *   journeyId: string,             // Unique journey identifier
 *   tenantId: string,              // Regional transport authority
 *   administrationId: string,      // Administrative ID
 *   operatorName: string,          // Name of train operator
 *   operatorCode: string,          // Short code for operator
 *   category: string,              // Train category (e.g. "S" for S-Bahn)
 *   type: string,                  // Train type (e.g. "CITY_TRAIN")
 *   date: string,                  // Journey date/time
 *   stops: Array<{                 // Array of stops along the route
 *     status: string,              // Stop status
 *     station: {                   // Station information
 *       evaNo: string,             // Station ID
 *       name: string,              // Station name
 *       position: {                // Geographic coordinates
 *         latitude: number,
 *         longitude: number
 *       }
 *     },
 *     track: {                     // Platform information
 *       target: string,            // Scheduled platform
 *       prediction: string         // Actual/predicted platform
 *     },
 *     messages: Array<{            // Delay/disruption messages
 *       code: string,
 *       text: string,
 *       textShort: string
 *     }>,
 *     departureTime?: {           // Departure timing (if applicable)
 *       target: string,           // Scheduled time
 *       predicted: string,        // Predicted time
 *       diff: number,            // Delay in minutes
 *       timeType: string         // Time prediction type
 *     },
 *     arrivalTime?: {            // Arrival timing (if applicable)
 *       target: string,          // Scheduled time
 *       predicted: string,       // Predicted time
 *       diff: number,           // Delay in minutes
 *       timeType: string        // Time prediction type
 *     }
 *   }>,
 *   started: boolean,             // Whether journey has started
 *   finished: boolean,            // Whether journey has finished
 *   hims: Array<any>,            // Additional messages/information
 *   validUntil: string,          // Data validity end time
 *   validFrom: string,           // Data validity start time
 *   isLoyaltyCaseEligible: boolean // Loyalty program eligibility
 * }>}
 */
export const getJourneyInfo = async (journeyID) => {
    return axios.get(config["base-url"] + "journey/" + journeyID, {}).then((response) => {
        return response.data;
    });
};