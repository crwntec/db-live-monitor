"use client";

import { Disruption } from "@/types/timetable";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export default function Disruptions({ data }: { data: Disruption[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!data || data.length === 0) return null;

  return (
    <div className="dark:bg-gray-900/95 px-2 md:px-4 py-4">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg p-4">
        <div
          className="flex items-center justify-between gap-2 mb-2 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <span className="text-red-600 dark:text-red-400 text-lg">⚠️</span>
            <h3 className="font-bold text-red-900 dark:text-red-100">
              Aktuelle Störungen ({data.length})
            </h3>
          </div>

          <button
            type="button"
            aria-expanded={isExpanded}
            aria-label={
              isExpanded ? "Störungen einklappen" : "Störungen ausklappen"
            }
            className="text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-800/30 rounded-full p-1 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-3 mt-3">
            {data.map((d, i) => (
              <div
                key={d.disruptionID || i}
                className="text-sm text-red-800 dark:text-red-200 border-l-2 border-red-300 pl-3"
              >
                {d.descriptions?.["DE"]?.text || "Keine Details verfügbar"}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
