export default function TrainInfo({ train }) {
  return (
    <div className="grid grid-cols-2 gap-4">
    <div>
      <p>
         <span className="sm:hidden">VU:</span> <strong className="hidden sm:block">Verkehrsunternehmen:</strong> {train.operatorName}
      </p>
      <p>
        <span className="sm:hidden">ZugNr:</span> <strong className="hidden sm:block">Zugnummer:</strong> {train.no}
      </p>
    </div>
    <div>
      <p>
        <span className="sm:hidden">Kategorie:</span> <strong className="hidden sm:block">Kategorie:</strong> {train.category}
      </p>
      <p>
        <span className="sm:hidden">LW:</span> <strong className="hidden sm:block">Laufweg:</strong> {train.stops[0].station.name} →{" "}
        {train.stops[train.stops.length - 1].station.name}
        </p>
      </div>
      <div>
        {train.hims.map((him) => (
          <div className="w-full" key={him.id}>
            <h3 className="text-sm font-bold sm:block hidden">{him.caption}</h3>
            <p className="text-sm sm:hidden">{him.shortText}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
