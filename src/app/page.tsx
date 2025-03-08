"use client";

import { useState } from "react";
import { autoCompleteStation } from "@/app/api/station";
import { Station } from "@/types/stations";
import Link from "next/link";
export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setStations([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await autoCompleteStation(query);
      setStations(response);
    } catch (error) {
      console.error("Error fetching stations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };


  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center ">
          DB-Live-Monitor
        </h1>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder="Enter station name..."
            className="w-full p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-300 dark:bg-gray-800 "
          />

          {isLoading && (
            <div className="mt-4 text-center text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          )}

          {stations.length > 0 && (
            <div className="mt-2 border rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700 flex flex-col">
              {stations.map((station) => (
                <Link
                  key={station.eva}
                  href={`/board/${station.eva}`}
                  className="w-full p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b last:border-b-0 dark:border-gray-700 dark:text-white"
                >
                  {station.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
