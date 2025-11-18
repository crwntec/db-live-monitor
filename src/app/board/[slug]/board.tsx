import { calculateDelay, hasLeft } from "@/util";
import StopGroup from "@/components/board/StopGroup";
import Navbar from "@/components/Navbar";
import { Disruption, StationData } from "@/types/timetable";
import { getDelayColor } from "@/util/colors";
import Disruptions from "@/components/board/Disruptions";

export default async function Board({
  dataPromise,
}: {
  dataPromise: Promise<StationData | null>;
}) {
  const data = await dataPromise;
  if (!data || !data?.stopGroups)
    return (
      <div className="p-4 text-center text-gray-500">
        Fehler beim Laden der Daten
      </div>
    );

  const activeStopGroups = data.stopGroups.filter(
    (stopGroup) => !hasLeft(stopGroup[0], 10),
  );

  const metrics = activeStopGroups.reduce(
    (acc, group) => {
      group.forEach((stop) => {
        const obj = stop.arrival || stop.departure;
        if (obj?.time && obj?.timeSchedule) {
          const delay = calculateDelay(obj.time, obj.timeSchedule);

          acc.totalDelay += delay;
          acc.count += 1;
          acc.maxDelay = Math.max(acc.maxDelay, delay);

          if (delay > 1) acc.delayedTrains += 1;
          if (delay > 6) acc.delayedTrainsDB += 1;
        }
        if (obj?.disruptions) {
          obj.disruptions.forEach((d) => {
            if (
              !acc.disruptions.some((e) => e.disruptionID === d.disruptionID)
            ) {
              acc.disruptions.push(d);
            }
          });
        }

        if (stop.canceled) acc.canceledTrains += 1;
      });
      return acc;
    },
    {
      totalDelay: 0,
      count: 0,
      maxDelay: 0,
      delayedTrains: 0,
      delayedTrainsDB: 0,
      canceledTrains: 0,
      disruptions: [] as Disruption[],
    },
  );

  const averageDelay =
    metrics.count > 0 ? (metrics.totalDelay / metrics.count).toFixed(1) : "0";

  const trainsPerHour = metrics.count > 0 ? metrics.count : 0;
  const trainsPerMinute = trainsPerHour / 60;
  const showPerMinute = trainsPerMinute >= 1;
  const frequencyDisplay = showPerMinute
    ? `${trainsPerMinute.toFixed(1)}/min`
    : `${trainsPerHour}/h`;

  const getCancelColor = (count: number, total: number) => {
    const ratio = total > 0 ? count / total : 0;
    if (ratio > 0.5) return "text-red-500";
    if (ratio > 0.15) return "text-yellow-500";
    return "text-green-500";
  };
  return (
    <div className="min-h-screen">
      <Navbar title={data.stationName} referring={"/"} />

      <div className="top-0 z-10 bg-gray-50/95 backdrop-blur dark:bg-gray-900/95 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-2 py-3 md:px-4 md:py-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-3">
            <MetricCard label="Züge" value={metrics.count} />

            <MetricCard label="Frequenz" value={frequencyDisplay} />

            <MetricCard
              label="Ø Verspätung"
              value={`${averageDelay} min`}
              valueClass={getDelayColor(parseFloat(averageDelay), true)}
            />

            <MetricCard
              label="Max Verspätung"
              value={`${metrics.maxDelay} min`}
              valueClass={getDelayColor(metrics.maxDelay, true)}
            />

            <MetricCard
              label="Verspätet (>1min)"
              value={
                metrics.count > 0
                  ? ((metrics.delayedTrains / metrics.count) * 100).toFixed(0) +
                    "%"
                  : "0%"
              }
              subValue={`(${metrics.delayedTrains})`}
            />

            <MetricCard
              label="Verspätet DB (>6min)"
              value={
                metrics.count > 0
                  ? ((metrics.delayedTrainsDB / metrics.count) * 100).toFixed(
                      0,
                    ) + "%"
                  : "0%"
              }
              subValue={`(${metrics.delayedTrainsDB})`}
            />

            <MetricCard
              label="Ausfälle"
              value={
                metrics.count > 0
                  ? ((metrics.canceledTrains / metrics.count) * 100).toFixed(
                      0,
                    ) + "%"
                  : "0%"
              }
              subValue={`(${metrics.canceledTrains})`}
              valueClass={getCancelColor(metrics.canceledTrains, metrics.count)}
            />
          </div>
        </div>
        {metrics.disruptions.length > 0 && (
          <Disruptions data={metrics.disruptions} />
        )}
      </div>
      {/* Train List */}
      <ul>
        {activeStopGroups.map((stopGroup, index) => (
          <StopGroup
            stopGroup={stopGroup}
            index={index}
            key={stopGroup[0].transport.journeyID || index}
          />
        ))}
      </ul>
    </div>
  );
}

function MetricCard({
  label,
  value,
  subValue,
  valueClass = "text-gray-900 dark:text-white",
}: {
  label: string;
  value: string | number;
  subValue?: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 p-2 md:p-3 rounded-lg shadow-sm flex flex-col justify-between border border-gray-100 dark:border-gray-700">
      <div className="text-[10px] md:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide truncate">
        {label}
      </div>
      <div
        className={`text-lg sm:text-xl md:text-2xl font-bold mt-1 leading-none ${valueClass}`}
      >
        {value}
        {subValue && (
          <span className="text-xs md:text-sm text-gray-400 dark:text-gray-500 ml-1.5 font-normal align-middle">
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
}
