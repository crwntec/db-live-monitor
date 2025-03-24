import { findStationByEvaId, findStationByDS100 } from '@/lib/stations';
import { Station } from '@/types/stations';
import autocomplete from 'db-hafas-stations-autocomplete';

const ds100Pattern = /^[abdefhklmnrstuw]{1}[a-z]|[A-Z]{1,4}$/;

export const getEVAFromDS100 = async (input: string) : Promise<number[] | null> => {
    if (ds100Pattern.test(input)) {
        try {
            const station = await findStationByDS100(input);
            return station ? [ station.eva, ...station.meta_evas] : null;
        } catch (error) {
            console.error('Error reading stations:', error);
            return null;
        }
    } else {
        const station = await findStationByEvaId(input);
        return station ? [station.eva, ...station.meta_evas] : null;
    }
};


export const autoCompleteStation = async (input: string) : Promise<Station[]> => {
    //Check if input is a DS100 code
    if (ds100Pattern.test(input)) {
        const station = await findStationByDS100(input);
        return station ? [station] : [];
    }
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