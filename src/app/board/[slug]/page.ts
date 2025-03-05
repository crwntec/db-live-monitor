import Board from "./board";
import { getEVAFromDS100 } from "@/api/station";
import { getTimetableForStation } from "@/api/timetable";

async function fetchTimetable(params) {
    //simulate loading
    await new Promise(resolve => setTimeout(resolve, 1000));
    try {
        const slug = (await params).slug;
        const evaIds = await getEVAFromDS100(slug);
        if (!evaIds) return null;

        const data = await getTimetableForStation(evaIds);
        return data;
    } catch (error) {
        console.error("Error fetching timetable:", error);
        return null;
    }
}

export default async function Page({ params }) {
    const data = fetchTimetable(params);

    return (
        <div>
             <Board dataPromise={data} />
        </div>
    );
}