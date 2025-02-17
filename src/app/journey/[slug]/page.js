import { getJourney } from "@/api/journey";
import { Suspense } from "react";
import Journey from "./Journey";

export default async function Page({params}) {
    const {slug} = await params;
    const dataPromise = getJourney(slug);
    return (
        <div>
            <Suspense fallback={<div>Loading...</div>}>
                <Journey dataPromise={dataPromise} />
            </Suspense>
        </div>
    );
}