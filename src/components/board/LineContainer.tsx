import { Transport } from "@/types/timetable";
import { getColor } from "@/util/colors";

export default function LineContainer({ transport }: { transport: Transport }) {
  const color = getColor(transport.category);
  return (
    <div
      className={`px-1 w-20 h-10 rounded-md flex items-center justify-center shrink-0`}
      style={{ backgroundColor: color }}
    >
      <div className="text-sm text-white whitespace-nowrap">
        {transport.journeyDescription || transport.number}
      </div>
    </div>
  );
}
