import Board from "./board";
import { getEVAFromDS100 } from "@/app/api/station";
import { getTimetableForStation } from "@/app/api/timetable";
import { PageParams } from "@/types/next";

async function fetchTimetable(params: PageParams) {
    //simulate loading
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
        const slug = (await params).slug;
        const evaIds = await getEVAFromDS100(slug);
        if (!evaIds) return null;

        const data = await getTimetableForStation(Array.isArray(evaIds) ? evaIds.map(String) : [evaIds]);
        return data;
    } catch (error) {
        console.error("Error fetching timetable:", error);
        return null;
    }
}



export default async function Page({ params }: { params: PageParams }) {
    const data = fetchTimetable(params);

    return (
        <div>
             <Board dataPromise={data} />
        </div>
    );
}