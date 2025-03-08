import { findStationByEvaId, findStationByDS100 } from '@/lib/stations';
import autocomplete from 'db-hafas-stations-autocomplete';

export const getEVAFromDS100 = async (input: string) => {
    const ds100Pattern = /^[abdefhklmnrstuw]{1}[a-z]|[A-Z]{1,4}$/;

    if (ds100Pattern.test(input)) {
        try {
            const station = await findStationByDS100(input);
            return station ? [ station.eva, ...station.meta_evas] : null;
        } catch (error) {
            console.error('Error reading stations:', error);
            return input;
        }
    } else {
        const station = await findStationByEvaId(input);
        return station ? [station.eva, ...station.meta_evas] : null;
    }
};


export const autoCompleteStation = async (input: string) => {
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