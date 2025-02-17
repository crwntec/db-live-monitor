import { readStations, findStationByEvaId } from '@/../lib/stations';
import autocomplete from 'db-hafas-stations-autocomplete';

export const getIBNRFromDS100 = async (input) => {
    const ds100Pattern = /^[abdefhklmnrstuw]{1}[a-z]|[A-Z]{1,4}$/;

    if (ds100Pattern.test(input)) {
        for await (const station of readStations()) {
            if (station.ril100 === input) return station.id;
        }
        return null;
    } else {
        return input;
    }
};


export const autoCompleteStation = async (input) => {
    const results = await autocomplete(input, 6);
    const mappedResults = [];
    
    for (const result of results) {
        const station = await findStationByEvaId(result.id);
        if (station) {
            mappedResults.push(station);
        }
    }
    
    return mappedResults;
}