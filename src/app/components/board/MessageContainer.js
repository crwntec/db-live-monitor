export default function MessageContainer({ stop }) {
    return (
        <div className="flex flex-col">
            {stop.delayMessages?.length > 0 && (
                <div className="flex">
                    {stop.delayMessages.map((message) => (
                        <div className="text-red-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-full flex-shrink-0" key={message.timestamp}>{message.text}{stop.delayMessages.length > 1 ? '++' : ''}</div>
                    ))}
                </div>
            )}
            {stop.qualityChanges?.length > 0 && (
                <div className="flex">
                    {stop.qualityChanges.map((message) => (
                        <div className="text-yellow-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-full flex-shrink-0" key={message.timestamp}>{message.text}{stop.qualityChanges.length > 1 ? '++' : ''}</div>
                    ))}
                </div>
            )}
        </div>
    );
}
