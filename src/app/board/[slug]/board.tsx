import { calculateDelay, hasLeft } from "@/util";
import StopGroup from "@/components/board/StopGroup";
import Navbar from "@/components/Navbar";
import { Disruption, StationData, Stop } from "@/types/timetable";
import { getDelayColor } from "@/util/colors";
import Disruptions from "@/components/board/Disruptions";

type BoardMetrics = {
  totalDelay: number;
  count: number;
  maxDelay: number;
  delayedTrains: number;
  delayedTrainsDB: number;
  canceledTrains: number;
  disruptions: Disruption[];
};

function calculateBoardMetrics(stopGroups: Stop[][]): BoardMetrics {
  const initial: BoardMetrics = {
    totalDelay: 0,
    count: 0,
    maxDelay: 0,
    delayedTrains: 0,
    delayedTrainsDB: 0,
    canceledTrains: 0,
    disruptions: [],
  };

  return stopGroups.reduce((acc, group) => {
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
          const alreadyExists = acc.disruptions.some(
            (e) => e.disruptionID === d.disruptionID,
          );
          if (!alreadyExists) acc.disruptions.push(d);
        });
      }

      if (stop.canceled) acc.canceledTrains += 1;
    });
    return acc;
  }, initial);
}

function getFrequencyDisplay(count: number): string {
  if (count === 0) return "0/h";
  const perMinute = count / 60;
  return perMinute >= 1 ? `${perMinute.toFixed(1)}/min` : `${count}/h`;
}

export default async function Board({
  dataPromise,
}: {
  dataPromise: Promise<StationData | null>;
}) {
  const data = await dataPromise;

  if (!data || !data.stopGroups) {
    return (
      <div className="flex h-screen items-center justify-center p-4 text-gray-500">
        <span>Fehler beim Laden der Daten</span>
      </div>
    );
  }

  const activeStopGroups = data.stopGroups.filter(
    (stopGroup) => !hasLeft(stopGroup[0], 10),
  );

  const metrics = calculateBoardMetrics(activeStopGroups);
  const averageDelay =
    metrics.count > 0 ? (metrics.totalDelay / metrics.count).toFixed(1) : "0";

  const getCancelColor = (count: number, total: number) => {
    const ratio = total > 0 ? count / total : 0;
    if (ratio > 0.5) return "text-red-600 dark:text-red-400";
    if (ratio > 0.15) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navbar title={data.stationName} referring={"/"} />

      <div className="top-0 z-20 border-b border-gray-200 bg-gray-50/95 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="space-y-2 px-2 py-3 md:px-4 md:py-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7 md:gap-3">
            <MetricCard label="Züge" value={metrics.count} />

            <MetricCard
              label="Frequenz"
              value={getFrequencyDisplay(metrics.count)}
            />

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
                  ? `${((metrics.delayedTrains / metrics.count) * 100).toFixed(0)}%`
                  : "0%"
              }
              subValue={`(${metrics.delayedTrains})`}
            />

            <MetricCard
              label="Verspätet DB (>6min)"
              value={
                metrics.count > 0
                  ? `${((metrics.delayedTrainsDB / metrics.count) * 100).toFixed(0)}%`
                  : "0%"
              }
              subValue={`(${metrics.delayedTrainsDB})`}
            />

            <MetricCard
              label="Ausfälle"
              value={
                metrics.count > 0
                  ? `${((metrics.canceledTrains / metrics.count) * 100).toFixed(0)}%`
                  : "0%"
              }
              subValue={`(${metrics.canceledTrains})`}
              valueClass={getCancelColor(metrics.canceledTrains, metrics.count)}
            />
          </div>

          {metrics.disruptions.length > 0 && (
            <div className="pt-1">
              <Disruptions data={metrics.disruptions} />
            </div>
          )}
        </div>
      </div>

      <main className="">
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {activeStopGroups.map((stopGroup, index) => (
            <StopGroup
              stopGroup={stopGroup}
              index={index}
              key={stopGroup[0].transport.journeyID || index}
            />
          ))}
        </ul>
      </main>
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
    <div className="flex flex-col justify-between rounded-lg border border-gray-100 bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-800 md:p-3">
      <dt className="truncate text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 md:text-xs">
        {label}
      </dt>
      <dd
        className={`mt-1 text-lg font-bold leading-none sm:text-xl md:text-2xl ${valueClass}`}
      >
        {value}
        {subValue && (
          <span className="ml-1.5 align-middle text-xs font-normal text-gray-400 dark:text-gray-500 md:text-sm">
            {subValue}
          </span>
        )}
      </dd>
    </div>
  );
}
