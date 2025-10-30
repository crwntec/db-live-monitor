"use client";
import { useSearchParams } from "next/navigation";
import {
  Building2,
  TrainFront,
  List,
  Route,
  TriangleAlert,
  Clock,
  Info,
  AlertCircle,
} from "lucide-react";
import { JourneyT } from "@/types/journey";
import { v4 as uuidv4 } from "uuid";
import { useState } from "react";
import { getHintIcon } from "@/util";

export default function TrainInfo({
  train,
}: {
  train: JourneyT;
  referringEva: string;
}) {
  const searchParams = useSearchParams();
  const wingId = searchParams.get("wingId");
  const wingStart = searchParams.get("wingStart");
  const wingDest = searchParams.get("wingDest");
  const wingName = searchParams.get("wingName");
  
  if (!train || !train.remarks) return null;
  // Group remarks by type
  const hints = train.remarks.filter((r) => r.type === "hint" && (!('code' in r) || r.code !== "OP"));
  const statuses = train.remarks.filter((r) => r.type === "status");
  const warnings = train.remarks.filter(
    (r) =>
      r.type === "warning" ||
      r.type === "foreign-id" ||
      r.type === "local-fare-zone" ||
      r.type === "stop-website" ||
      r.type === "stop-dhid" ||
      r.type === "transit-authority"
  );

  const cancelledStops = train.stopovers?.filter((s) => s.cancelled) || [];

    return (
    <div className="border border-gray-700 rounded-lg shadow-lg dark:bg-gray-800 overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r dark:from-gray-900 dark:to-gray-800 p-4 border-b border-gray-700">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm dark:text-gray-200">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span className="font-medium">{train.line?.operator?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm dark:text-gray-200">
              <TrainFront className="w-4 h-4 text-blue-400" />
              <span className="font-mono font-semibold">{train.line?.fahrtNr}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm dark:text-gray-200">
              <List className="w-4 h-4 text-blue-400" />
              <span className="font-medium">{train.line?.productName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm dark:text-gray-200">
              <Route className="w-4 h-4 text-blue-400" />
              <span className="font-medium truncate">
                {train.stopovers?.[0]?.stop?.name} →{" "}
                {train.stopovers?.[train.stopovers.length - 1]?.stop?.name}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts & Notices Section */}
      {(statuses.length > 0 || warnings.length > 0 || cancelledStops.length > 0 || hints.length > 0) && (
        <div className="px-4 py-3 space-y-2">
          {/* Critical Status Messages */}
          {statuses.map((remark) => (
            <div
              key={uuidv4()}
              className="flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-600 dark:text-red-400">{remark.text}</p>
            </div>
          ))}

          {/* Warnings */}
          {warnings.map((remark) => (
            <div
              key={uuidv4()}
              className="flex items-center gap-2"
            >
              <TriangleAlert className="w-4 h-4 text-orange-500 dark:text-orange-400 flex-shrink-0" />
              <p className="text-xs text-orange-500 dark:text-orange-400">{remark.text}</p>
            </div>
          ))}

          {/* Cancelled Stops */}
          {cancelledStops.length > 0 && (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-700 dark:text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-700 dark:text-red-400">
                Ohne Halt in {cancelledStops.map((s) => s.stop?.name).join(", ")}
              </p>
            </div>
          )}

          {/* Hints - Icon badges */}
          {hints.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {hints.map((hint) => (
                <HintBadge 
                  key={uuidv4()} 
                  text={hint.text || ""} 
                  code={'code' in hint ? hint.code : undefined} 
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Wing Information */}
      {wingId && (
        <div className="px-4 pb-3 pt-1">
          <div className="flex items-center gap-2 text-xs text-blue-400">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
                Fährt von {wingStart} bis {wingDest} vereint mit <a className={"hover:cursor-pointer underline"} >{wingName}</a>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
// Compact hint badge with icon and tooltip
function HintBadge({ text, code }: { text: string; code: string | null | undefined }) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = getHintIcon(code, text);

  return (
    <div
      className="relative inline-block z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        className="p-1.5 hover:bg-gray-200 dark:bg-gray-700/50 dark:hover:bg-gray-600/50 border dark:border-gray-600 rounded-md transition-colors cursor-help"
        onClick={() => setIsHovered(!isHovered)}
        aria-label={text}
      >
        <Icon className="w-4 h-4 dark:text-gray-300" />
      </button>

      {/* Tooltip */}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-gray-950 text-gray-100 text-xs rounded-lg px-3 py-2 max-w-[200px] sm:max-w-xs shadow-lg border border-gray-700 whitespace-normal">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="border-4 border-transparent border-t-gray-950" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}