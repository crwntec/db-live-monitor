import moment from "moment-timezone";
import { v4 as uuidv4 } from 'uuid';
export default async function Board({ dataPromise }) {
    const data = await dataPromise;
    if (!data) return <div>Fehler beim Laden der Daten</div>;
    
  function hasLeft(item, lookBack) {
    const nowTimestamp = moment().valueOf();
    const time = moment(item.arrival ? item.arrival.timePredicted : item.departure.timePredicted);
    return nowTimestamp > time.add(lookBack, "minutes").valueOf();
  }
    return (
        <div>
            <h1>{data.stationName || "Unbekannter Bahnhof"}</h1>
            <ul>
                {data.items.map((stop) => !hasLeft(stop, 10) && (
                    <li key={stop.train.id + uuidv4()} className={hasLeft(stop) ? "line-through text-gray-500" : "hover:bg-gray-800"}>
                        <a
                            href={
                                stop.canceled
                                    ? "#"
                                    : `/journey/${stop.train.journeyId}${
                                          stop.wing
                                              ? `?wing=${
                                                    stop.wing.isLeading
                                                        ? stop.wing.wing
                                                        : stop.wing.origin
                                                }`
                                              : ""
                                      }`
                            }
                            className={stop.canceled ? "line-through text-red-500" : ""}
                        >
                            {stop.wing ? (stop.wing.isLeading ? "|-" : "|_") : ""}{" "}
                            {stop.train.category} {stop.train.lineName} -{" "}
                            {stop.departure
                                ? `Nach ${stop.departure.destination.name}`
                                : `Von ${stop.arrival.origin.name}`}{" "}
                            -{" "}
                            {moment(
                                stop.departure ? stop.departure.timePredicted : stop.arrival.timePredicted
                            ).format("HH:mm")}{" "}
                            (+
                            {stop.departure ? stop.departure.diff : stop.arrival.diff} min)
                        </a>
                        {stop.delayMessages?.length > 0 && (
                            <div>
                                {stop.delayMessages.map((message) => (
                                    <div key={message.timestamp}>{message.message}</div>
                                ))}
                            </div>
                        )}
                        {stop.qualityChanges?.length > 0 && (
                            <div>
                                {stop.qualityChanges.map((message) => (
                                    <div key={message.timestamp}>{message.message}</div>
                                ))}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
