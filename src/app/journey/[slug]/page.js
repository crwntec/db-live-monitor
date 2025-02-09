import { getJourney } from "@/api/journey";
export default async function Page({params}) {
    const {slug} = await params;
    const data = await getJourney(slug);
    return (
        <div>
            <h1>{data.name}</h1>
        </div>
    );
}