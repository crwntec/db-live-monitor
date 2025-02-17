import moment from "moment";

export default async function Journey({dataPromise}) { 
    const data = await dataPromise;
    return (
        <div className="p-4">
            {/* Train Information */}
            <section className="mb-8">
                <h1 className="text-2xl font-bold mb-4">
                    {data.name}
                    {!data.name.includes(data.no) && ` (${data.no})`}
                </h1>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p><strong>Type:</strong> {data.type}</p>
                        <p><strong>Number:</strong> {data.no}</p>
                    </div>
                    <div>
                        <p><strong>Category:</strong> {data.category}</p>
                        <p><strong>Direction:</strong> {data.stops[0].station.name} → {data.stops[data.stops.length - 1].station.name}</p>
                    </div>
                </div>
            </section>

            {/* Stops */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3">Zwischenhalte</h2>
                <div className="space-y-2">
                    {data.stops.map((stop) => (
                        <div key={stop.station.evaNo} className="border p-3 rounded">
                            <p className="font-medium">{stop.station.name}</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <p><strong>Arrival:</strong> {moment(stop.arrivalTime?.predicted).format("HH:mm") || 'N/A'}</p>
                                <p><strong>Departure:</strong> {moment(stop.departureTime?.predicted).format("HH:mm") || 'N/A'}</p>
                                <p><strong>Platform:</strong> {stop.track.prediction || 'N/A'}</p>
                                <p><strong>Station ID:</strong> {stop.station.evaNo}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Carriage Sequence */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3">Wagen</h2>
                <div className="space-y-4">
                    {data.carriageSequence?.groups?.map((group) => (
                        <div key={group.name} className="border p-4 rounded">
                            <div className="mb-3">
                                <h3 className="font-medium">{group.name}</h3>
                                <p className="text-sm text-gray-600">
                                    {group.transport.category} {group.transport.number} → {group.transport.destination.name}
                                </p>
                            </div>
                            
                            <div className="space-y-2">
                                {group.vehicles.map((vehicle) => (
                                    <div key={vehicle.vehicleID} className="border-t pt-2">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <p><strong>Wagen:</strong> {vehicle.wagonIdentificationNumber}</p>
                                            <p><strong>Klasse:</strong> {vehicle.type.hasFirstClass ? '1.' : ''}{vehicle.type.hasEconomyClass ? '2.' : ''} Klasse</p>
                                            <p><strong>Typ:</strong> {vehicle.type.category}</p>
                                            <p><strong>Sektor:</strong> {vehicle.platformPosition.sector}</p>
                                            <p><strong>Ausrichtung:</strong> {vehicle.orientation === 'FORWARDS' ? 'Vorwärts' : 'Rückwärts'}</p>
                                            {vehicle.amenities.length > 0 && (
                                                <p><strong>Ausstattung:</strong> {vehicle.amenities.map(a => a.type).join(', ')}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
