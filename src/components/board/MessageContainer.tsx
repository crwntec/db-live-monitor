import { Stop } from "@/types/timetable";

export default function MessageContainer({ stop }: { stop: Stop }) {
  const rawMessages = [
    ...(stop.arrival?.messages.filter((m) => m.category == null) || []),
    ...(stop.departure?.messages.filter((m) => m.category == null) || []),
  ];

  const journeyMessages = Array.from(
    new Map(rawMessages.map((m) => [m.text, m])).values(),
  );
  return (
    <div className="flex flex-col overflow-x-hidden">
      {journeyMessages.length > 0 && (
        <div className="flex">
          {journeyMessages.map((message, index) => (
            <div
              className="text-red-500 whitespace-nowrap max-w-full flex-shrink-0 text-xs sm:text-base"
              key={message.text + index}
            >
              {message.text}
              {index < journeyMessages.length - 1 ||
              (stop.irisDelayMessages && stop.irisDelayMessages.length > 0)
                ? " ++ "
                : ""}
            </div>
          ))}
        </div>
      )}
      {stop.irisDelayMessages?.length > 0 && (
        <div className="flex">
          {stop.irisDelayMessages.map(
            (message) =>
              !journeyMessages.some((m) => m.text == message.text) && (
                <div
                  className="text-red-500 whitespace-nowrap max-w-full flex-shrink-0 text-xs sm:text-base"
                  key={message.timestamp + message.text}
                >
                  {message.text}
                  {stop.irisDelayMessages.length > 1 ? "++" : ""}
                </div>
              ),
          )}
        </div>
      )}
      {stop.irisQualityChanges?.length > 0 && (
        <div className="flex">
          {stop.irisQualityChanges.map((message) => (
            <div
              className="text-yellow-500 whitespace-nowrap max-w-full flex-shrink-0 text-xs sm:text-base"
              key={message.timestamp + message.text}
            >
              {message.text}
              {stop.irisQualityChanges.length > 1 ? "++" : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
