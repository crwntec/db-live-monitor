'use client';

import { FeatureCollection } from "hafas-client";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/journey/Map"), { ssr: false });

export default function MapWrapper({ polyline }: { polyline: FeatureCollection }) {
    return <Map polyline={polyline} />;
}