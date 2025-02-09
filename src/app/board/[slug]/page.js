import Board from "./board";
import { Suspense } from "react";
import { getIBNRFromDS100 } from "@/api/station";
import { getTimetableForStation } from "@/api/timetable";

async function fetchTimetable(params) {
    try {
        const slug = (await params).slug;
        const ibnr = await getIBNRFromDS100(slug);
        if (!ibnr) return null;

        const data = await getTimetableForStation(ibnr);
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
            <Suspense fallback={<div>Loading...</div>}>
                <Board dataPromise={data} />
            </Suspense>
        </div>
    );
}
