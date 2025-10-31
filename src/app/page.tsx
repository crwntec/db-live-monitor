"use client";

import { useState, useTransition, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { autoCompleteStation } from "@/app/api/station";
import { Station } from "@/types/stations";
import { useRouter } from "next/navigation";
import { Spinner } from "flowbite-react";
import Footer from "@/components/Footer";
import Image from "next/image";
import { Search, MapPin, TrainFront, ArrowRight, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Trip } from "hafas-client";
import moment from "moment-timezone";

// Custom hook for optimized search with caching and debouncing
function useOptimizedSearch() {
    const [searchQuery, setSearchQuery] = useState("");
    const [stations, setStations] = useState<Station[]>([]);
    const [hafasTrips, setTrips] = useState<Trip[]>([]);
    const [inputLoading, setInputLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cache = useRef(new Map<string, any>());
    const abortController = useRef<AbortController | null>(null);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const performSearch = useCallback(async (query: string) => {
        if (query.length < 2) {
            setStations([]);
            setTrips([]);
            setInputLoading(false);
            return;
        }

        const trimmedQuery = query.trim();

        if (cache.current.has(trimmedQuery)) {
            const cachedResult = cache.current.get(trimmedQuery);
            if (cachedResult.isTrips) {
                setTrips(cachedResult.possibleTrips || []);
                setStations([]);
            } else {
                setStations(cachedResult.possibleStations || []);
                setTrips([]);
            }
            setInputLoading(false);
            setError(null);
            return;
        }

        if (abortController.current) abortController.current.abort();
        abortController.current = new AbortController();

        try {
            setInputLoading(true);
            setError(null);

            const response = await autoCompleteStation(trimmedQuery);

            cache.current.set(trimmedQuery, response);

            if (cache.current.size > 50) {
                const firstKey = cache.current.keys().next().value;
                if (typeof firstKey === "string") cache.current.delete(firstKey);
            }

            if (response.isTrips) {
                setTrips(response.possibleTrips || []);
                setStations([]);
            } else {
                setStations(response.possibleStations || []);
                setTrips([]);
            }
        } catch (error) {
            if (error instanceof Error && error.name !== "AbortError") {
                console.error("Error fetching stations:", error);
                setError("Failed to search. Please try again.");
            }
        } finally {
            setInputLoading(false);
        }
    }, []);

    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        if (searchQuery.length < 2) {
            setStations([]);
            setTrips([]);
            setInputLoading(false);
            return;
        }

        setInputLoading(true);
        debounceTimer.current = setTimeout(() => {
            performSearch(searchQuery);
        }, 300);

        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [searchQuery, performSearch]);

    useEffect(() => {
        return () => {
            if (abortController.current) abortController.current.abort();
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, []);

    return {
        searchQuery,
        setSearchQuery,
        stations,
        hafasTrips,
        inputLoading,
        error,
        clearCache: () => cache.current.clear(),
    };
}

// Memoized components
const StationResult = memo(
    ({
         station,
         isSelected,
         onClick,
         isFavorite,
         handleFavorite,
     }: {
        station: Station;
        isSelected: boolean;
        onClick: (eva: number) => void;
        isFavorite: boolean;
        handleFavorite: () => void;
    }) => (
        <motion.button
            key={station.eva}
            whileTap={{ scale: 0.98 }}
            className={`w-full p-3 flex items-center space-x-3 text-left hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 dark:text-white ${
                isSelected ? "bg-gray-200 dark:bg-gray-600" : ""
            }`}
        >
            <MapPin className="text-blue-500 flex-shrink-0" size={20} />
            <div className="min-w-0 flex-1" onClick={() => onClick(station.eva)}>
                <div className="truncate font-medium">{station.name}</div>
                {station.ds100 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">{station.ds100}</div>
                )}
            </div>
            <Star
                className={`cursor-pointer flex-shrink-0 hover:scale-110 transition-transform ${
                    isFavorite ? "text-blue-500 fill-blue-500" : "text-gray-400 dark:text-gray-500"
                }`}
                size={20}
                onClick={(e) => {
                    e.stopPropagation();
                    handleFavorite();
                }}
            />
        </motion.button>
    )
);
StationResult.displayName = "StationResult";

const TripResult = memo(
    ({
         trip,
         isSelected,
         onClick,
     }: {
        trip: Trip;
        isSelected: boolean;
        onClick: (trip: Trip) => void;
    }) => (
        <motion.button
            key={trip.id}
            onClick={() => onClick(trip)}
            whileTap={{ scale: 0.98 }}
            className={`w-full p-3 text-left hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 dark:text-white ${
                isSelected ? "bg-gray-200 dark:bg-gray-600" : ""
            }`}
        >
            <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                    <div className="flex items-center min-w-0 flex-1">
                        <TrainFront className="text-blue-500 mr-2 flex-shrink-0" size={20} />
                        <span className="truncate">{trip.line?.name || "Unknown Train"}</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                        {moment(trip.plannedDeparture).format("HH:mm")}
                    </div>
                </div>
                <div className="w-full text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center min-w-0">
                    <span className="truncate">{trip.origin?.name}</span>
                    <ArrowRight className="mx-1 flex-shrink-0" size={12} />
                    <span className="truncate">{trip.destination?.name}</span>
                </div>
            </div>
        </motion.button>
    )
);
TripResult.displayName = "TripResult";
function getInitialFavorites(): Map<number, Station> {
    if (typeof window === 'undefined') return new Map(); // SSR safety
    try {
        const stored = localStorage.getItem('favoritedStations');
        if (stored) {
            return new Map(JSON.parse(stored));
        }
    } catch (e) {
        console.error('Failed to parse favorites from localStorage', e);
    }
    return new Map();
}
export default function Home() {
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);
    // Changed from useRef to useState to trigger re-renders
    const [favoritedStations, setFavoritedStations] = useState<Map<number, Station>>(() => getInitialFavorites());
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const { searchQuery, setSearchQuery, stations, hafasTrips, inputLoading, error } =
        useOptimizedSearch();

    const totalResults = useMemo(() => stations.length + hafasTrips.length, [stations, hafasTrips]);

    // Load favorites from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem('favoritedStations');
            if (stored) {
                const parsed = JSON.parse(stored);
                setFavoritedStations(new Map(parsed));
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    }, []);

    // Save favorites to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('favoritedStations', JSON.stringify(Array.from(favoritedStations.entries())));
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    }, [favoritedStations]);

    useEffect(() => {
        const handleKeydown = (e: KeyboardEvent) => {
            if (totalResults === 0) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % totalResults);
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + totalResults) % totalResults);
            }
            if (e.key === "Enter" && selectedIndex >= 0) {
                e.preventDefault();
                if (selectedIndex < stations.length) {
                    handleStationClick(stations[selectedIndex].eva);
                } else {
                    const tripIndex = selectedIndex - stations.length;
                    handleTripClick(hafasTrips[tripIndex]);
                }
            }
            if (e.key === "Escape") {
                setSearchQuery("");
                setSelectedIndex(-1);
            }
        };
        window.addEventListener("keydown", handleKeydown);
        return () => window.removeEventListener("keydown", handleKeydown);
    }, [stations, hafasTrips, selectedIndex, totalResults]);

    useEffect(() => {
        setSelectedIndex(-1);
    }, [stations, hafasTrips]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }, [setSearchQuery]);

    const handleStationClick = useCallback(
        (eva: number) => startTransition(() => router.push(`/board/${eva}`)),
        [router]
    );

    const handleTripClick = useCallback(
        (hafasTrip: Trip) => {
            if (!hafasTrip?.line?.fahrtNr) return;
            const trainNumber = hafasTrip.line.fahrtNr;
            const trainName = hafasTrip.line.productName
                ? `${hafasTrip.line.productName}${hafasTrip.line.fahrtNr}`
                : hafasTrip.line.name || "";
            const departureTime = hafasTrip.plannedDeparture?.toString() || "";
            const referringEva = hafasTrip.origin?.id || hafasTrip.destination?.id;
            if (!referringEva || !departureTime) return;

            const params = new URLSearchParams({
                referringEva,
                trainName,
                lineName: hafasTrip.line.productName + (hafasTrip.line.id || ""),
                trainNumber: hafasTrip.line.fahrtNr.toString(),
                date: departureTime,
                onlyArrival: (!hafasTrip.departure).toString(),
            });

            startTransition(() => router.push(`/journey/${trainNumber}?${params.toString()}`));
        },
        [router]
    );

    const handleToggleFavorite = useCallback((station: Station) => {
        setFavoritedStations((prev) => {
            const newMap = new Map(prev);
            if (newMap.has(station.eva)) {
                newMap.delete(station.eva);
            } else {
                newMap.set(station.eva, station);
            }
            return newMap;
        });
    }, []);

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
                    <Image src="/icons/icon-512.png" alt="DB Live Monitor Logo" width={80} height={80} priority />
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mt-2">DB Live Monitor</h1>
                </div>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">
                    Unofficial Live Departure Monitor for German Railway Stations
                </p>

                {/* Search Box */}
                <div className="relative w-full">
                    <div className="relative flex items-center">
                        <Search
                            className="absolute left-4 text-gray-500 dark:text-gray-400 pointer-events-none"
                            size={20}
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleInputChange}
                            placeholder="Enter station or train number..."
                            className="w-full p-3 pl-12 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-colors"
                            autoComplete="off"
                            spellCheck={false}
                        />
                        {inputLoading && (
                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                <Spinner size="sm" />
                            </div>
                        )}
                    </div>

                    {error && <div className="mt-2 text-red-500 dark:text-red-400 text-sm">{error}</div>}
                </div>
                {/* Favorites */}
                {searchQuery.length === 0 && favoritedStations.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-3 w-full"
                    >
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 text-left">
                            Favorite Stations
                        </h2>
                        <div className="border-gray-300 dark:border-gray-600 rounded-lg shadow-lg bg-white dark:bg-gray-800">
                            {Array.from(favoritedStations).map(([_,s]) => {
                                return (
                                    <StationResult
                                        key={s.eva}
                                        station={s}
                                        isSelected={false}
                                        isFavorite={true}
                                        handleFavorite={() => handleToggleFavorite(s)}
                                        onClick={handleStationClick}
                                    />
                                );
                            })}
                        </div>
                    </motion.div>
                )}


                {/* Results */}
                {(stations.length > 0 || hafasTrips.length > 0) && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-3 w-full border-gray-300 dark:border-gray-600 rounded-lg shadow-lg bg-white dark:bg-gray-800 max-h-96 overflow-y-auto"
                    >
                        {stations.map((station, index) => (
                            <StationResult
                                key={station.eva}
                                station={station}
                                isSelected={selectedIndex === index}
                                isFavorite={favoritedStations.has(station.eva)}
                                handleFavorite={() => handleToggleFavorite(station)}
                                onClick={handleStationClick}
                            />
                        ))}

                        {hafasTrips.map((hafasTrip, index) => (
                            <TripResult
                                key={hafasTrip.id}
                                trip={hafasTrip}
                                isSelected={selectedIndex === index + stations.length}
                                onClick={handleTripClick}
                            />
                        ))}
                    </motion.div>
                )}

                {/* No results message */}
                {searchQuery.length >= 2 && !inputLoading && stations.length === 0 && hafasTrips.length === 0 && !error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-3 w-full p-4 text-center text-gray-500 dark:text-gray-400 text-sm"
                    >
                        No results found for &quot;{searchQuery}&quot;
                    </motion.div>
                )}
            </div>

            <Footer />
        </main>
    );
}