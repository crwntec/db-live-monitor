"use client";

import { useState, useTransition, useEffect } from "react";
import { autoCompleteStation } from "@/app/api/station";
import { Station } from "@/types/stations";
import { useRouter } from "next/navigation";
import { Spinner } from "flowbite-react";
import Footer from "@/components/Footer";
import Image from "next/image";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationIndex, setSelectedStationIndex] = useState<number>(-1);
  const [isPending, startTransition] = useTransition();
  const [inputLoading, setInputLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (searchQuery.length < 2) {
      setStations([]);
      return;
    }

    setInputLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const response = await autoCompleteStation(searchQuery);
        setStations(response);
      } catch (error) {
        console.error("Error fetching stations:", error);
      } finally {
        setInputLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" && stations.length > 0) {
        setSelectedStationIndex(
          (prevIndex) => (prevIndex + 1) % stations.length
        );
      }
      if (e.key === "ArrowUp" && stations.length > 0) {
        setSelectedStationIndex(
          (prevIndex) => (prevIndex - 1 + stations.length) % stations.length
        );
      }
      if (e.key === "Enter" && stations.length > 0) {
        handleStationClick(stations[selectedStationIndex].eva);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [stations, selectedStationIndex]);

  const handleStationClick = (eva: number) => {
    startTransition(() => router.push(`/board/${eva}`));
  };

  return (
    <main className="min-h-screen p-8 flex flex-col justify-between items-center bg-gray-100 dark:bg-gray-900">
      {/* Loading overlay */}
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
          <Spinner size="lg" />
        </div>
      )}

      <div className="max-w-2xl w-full flex flex-col items-center text-center">
        {/* Logo */}
        <div className="flex items-center">
          <Image
            src="/icons/icon-512.png"
            alt="DB Live Monitor Logo"
            width={100}
            height={100}
            className="mb-4 pr-4"
          />
          <h1 className="text-4xl font-bold mb-6 text-gray-800 dark:text-white">
            DB Live Monitor
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          Unofficial Live Departure Monitor for German Railway Stations
        </p>

        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            placeholder="Enter station name..."
            className="w-full p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 pr-12"
          />
          {inputLoading && (
            <div className="absolute inset-y-0 right-3 flex items-center">
              <Spinner size="sm" />
            </div>
          )}
        </div>

        {stations.length > 0 && (
          <div className="mt-3 border rounded-lg shadow-lg bg-white dark:bg-gray-800 w-full">
            {stations.map((station, index) => (
              <button
                key={station.eva}
                onClick={() => handleStationClick(station.eva)}
                className={`w-full p-4 text-left hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border-b last:border-b-0 dark:border-gray-700 dark:text-white ${
                  selectedStationIndex === index
                    ? "bg-gray-200 dark:bg-gray-600"
                    : ""
                }`}
              >
                {station.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
