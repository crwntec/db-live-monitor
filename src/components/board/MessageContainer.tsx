import { Stop } from "@/types/timetable";

export default function MessageContainer({ stop } : { stop: Stop }) {
    return (
        <div className="flex flex-col overflow-x-hidden">
            {stop.delayMessages?.length > 0 && (
                <div className="flex">
                    {stop.delayMessages.map((message) => (
                        <div className="text-red-500 whitespace-nowrap max-w-full flex-shrink-0" key={message.timestamp+message.text}>{message.text}{stop.delayMessages.length > 1 ? '++' : ''}</div>
                    ))}
                </div>
            )}
            {stop.qualityChanges?.length > 0 && (
                <div className="flex">
                    {stop.qualityChanges.map((message) => (
                        <div className="text-yellow-500 whitespace-nowrap max-w-full flex-shrink-0" key={message.timestamp+message.text}>{message.text}{stop.qualityChanges.length > 1 ? '++' : ''}</div>
                    ))}
                </div>
            )}
        </div>
    );
}
