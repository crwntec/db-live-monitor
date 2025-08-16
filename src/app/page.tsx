"use client";

import { useState, useTransition, useEffect } from "react";
import { autoCompleteStation } from "@/app/api/station";
import { Station } from "@/types/stations";
import { useRouter } from "next/navigation";
import { Spinner } from "flowbite-react";
import Footer from "@/components/Footer";
import Image from "next/image";
import { Search, MapPin, TrainFront, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Trip } from "hafas-client";
import moment from "moment-timezone";
import { getJourneyId } from "@/app/api/journey";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [stations, setStations] = useState<Station[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isPending, startTransition] = useTransition();
  const [inputLoading, setInputLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (searchQuery.length < 2) {
      setStations([]);
      setTrips([]);
      return;
    }

    setInputLoading(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const response = await autoCompleteStation(searchQuery);
        if (response.isTrips) {
          setTrips(response.possibleTrips || []);
          setStations([]);
        } else {
          setStations(response.possibleStations || []);
          setTrips([]);
        }
      } catch (error) {
        console.error("Error fetching stations:", error);
      } finally {
        setInputLoading(false);
      }
    }, 100);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" && stations.length > 0) {
        setSelectedIndex((prevIndex) => (prevIndex + 1) % stations.length);
      }
      if (e.key === "ArrowUp" && stations.length > 0) {
        setSelectedIndex(
          (prevIndex) => (prevIndex - 1 + stations.length) % stations.length
        );
      }
      if (e.key === "Enter" && stations.length > 0) {
        handleStationClick(stations[selectedIndex].eva);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [stations, selectedIndex]);

  const handleStationClick = (eva: number) => {
    startTransition(() => router.push(`/board/${eva}`));
  };

  const handleTripClick = async (trip: Trip) => {
    const jid = await getJourneyId(trip);
    startTransition(() => router.push(`/journey/${jid}`));
  };

  return (
    <main className="min-h-screen px-4 py-6 flex flex-col justify-between items-center bg-gray-100 dark:bg-gray-900">
      {isPending && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
          <Spinner size="lg" />
        </div>
      )}

      <div className="max-w-lg w-full flex flex-col items-center text-center">
        {/* Logo */}
        <div className="flex flex-col items-center mb-4">
          <Image
            src="/icons/icon-512.png"
            alt="DB Live Monitor Logo"
            width={80}
            height={80}
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mt-2">
            DB Live Monitor
          </h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">
          Unofficial Live Departure Monitor for German Railway Stations
        </p>

        {/* Search Box */}
        <div className="relative w-full">
          <div className="relative flex items-center">
            <Search
              className="absolute left-4 text-gray-500 dark:text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              placeholder="Enter station or train number..."
              className="w-full p-3 pl-12 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
            />
            {inputLoading && (
              <div className="absolute inset-y-0 right-3 flex items-center">
                <Spinner size="sm" />
              </div>
            )}
          </div>
        </div>

        {/* Stations Results */}
        {stations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 w-full border-gray-500 rounded-lg shadow-md bg-white dark:bg-gray-800"
          >
            {stations.map((station, index) => (
              <motion.button
                key={station.eva}
                onClick={() => handleStationClick(station.eva)}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-3 flex items-center space-x-3 text-left hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 dark:text-white ${
                  selectedIndex === index ? "bg-gray-200 dark:bg-gray-600" : ""
                }`}
              >
                <MapPin className="text-blue-500" size={20} />
                <span>{station.name}</span>
              </motion.button>
            ))}
          </motion.div>
        )}

        {/* Trips Results */}
        {trips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 w-full border-gray-500 rounded-lg shadow-md bg-white dark:bg-gray-800"
          >
            {trips.map((trip, index) => (
              <motion.button
                key={trip.id}
                onClick={() => handleTripClick(trip)}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-3 text-left hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 dark:text-white ${
                  selectedIndex === index ? "bg-gray-200 dark:bg-gray-600" : ""
                }`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <TrainFront className="text-blue-500 mr-2" size={20} />
                      <span>{trip.line?.name || "Unknown Train"}</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {moment(trip.plannedDeparture).format("HH:mm")}
                    </div>
                  </div>

                  <div className="w-full text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center">
                    {trip.origin?.name}
                    <ArrowRight className="mx-1" size={12} />
                    {trip.destination?.name}
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>
      <Footer />
    </main>
  );
}
