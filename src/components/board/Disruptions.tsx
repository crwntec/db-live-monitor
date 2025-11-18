"use client";

import { Disruption } from "@/types/timetable";
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function Disruptions({ data }: { data: Disruption[] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data || data.length === 0) return null;

  return (
    <div className="w-full">
      <div
        className={`
          overflow-hidden rounded-lg border transition-all duration-200 ease-in-out
          ${
            isExpanded
              ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800/50"
              : "bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30 hover:bg-red-100/50 dark:hover:bg-red-900/20"
          }
        `}
      >
        {/* Header - Clickable to toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between px-3 py-2 md:px-4"
          aria-expanded={isExpanded}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle
              className={`h-5 w-5 ${isExpanded ? "text-red-600 dark:text-red-400" : "text-red-500 dark:text-red-500/70"}`}
            />
            <span
              className={`font-semibold text-sm md:text-base ${isExpanded ? "text-red-900 dark:text-red-100" : "text-red-800 dark:text-red-200"}`}
            >
              {data.length} {data.length === 1 ? "Störung" : "Störungen"}
            </span>
          </div>

          <div className="text-red-400 dark:text-red-500">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-red-200/50 px-3 py-3 dark:border-red-800/50 md:px-4">
            <div className="space-y-3">
              {data.map((d, i) => (
                <div
                  key={d.disruptionID || i}
                  className="flex gap-3 text-sm text-red-800 dark:text-red-200"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  <p className="leading-snug">
                    {d.descriptions?.["DE"]?.textShort ||
                      "Keine Details verfügbar"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
