import moment from "moment-timezone";

export default async function Board({ dataPromise }) {
    const data = await dataPromise;
    if (!data) return <div>Fehler beim Laden der Daten</div>;

    return (
        <div>
            <h1>{data.stationName || "Unbekannter Bahnhof"}</h1>
            <ul>
                {data.items.map((stop) => (
                    <li key={stop.train.id} className="hover:bg-gray-800">
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
                    </li>
                ))}
            </ul>
        </div>
    );
}
