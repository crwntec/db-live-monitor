'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { autoCompleteStation } from '@/api/station';
export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [stations, setStations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (query) => {
    if (query.length < 2) {
      setStations([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await autoCompleteStation(query);
      setStations(response);
    } catch (error) {
      console.error('Error fetching stations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleStationSelect = (station) => {
    router.push(`/board/${station.eva}`);
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
            className="w-full p-4 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-black text-white"
          />

          {isLoading && (
            <div className="mt-4 text-center text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          )}

          {stations.length > 0 && (
            <div className="mt-2 border rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700">
              {stations.map((station) => (
                <button
                  key={station.eva}
                  onClick={() => handleStationSelect(station)}
                  className="w-full p-4 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b last:border-b-0 dark:border-gray-700 dark:text-white"
                >
                  {station.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
