import moment from "moment";
import { getDelayColor } from "@/util/colors";
import { StopTime } from "@/types/timetable";
export default function TimeContainer({ time, canceled }: { time: StopTime; canceled: boolean }) {
  return (
    <div className="flex items-center ">
      <div className={`text-sm ${
          canceled ? "line-through text-red-500" : getDelayColor(time.diff)
        } hidden sm:block`}
      >
        (+{time.diff||0}min)
      </div>
      <div className="flex flex-col items-end ml-1 sm:w-10 w-24">
        <div
          className={`text-sm ${
            canceled || time.diff > 0 ? "line-through" + (canceled ? ' text-red-500' : "") : ""
          }`}
        >
          {moment(time.time).format("HH:mm")}
        </div>
        <div
          className={`text-sm ${
            canceled ? "line-through text-red-500" : getDelayColor(time.diff)
          }`}
        >
          {moment(time.timePredicted).format("HH:mm")}
        </div>
      </div>
    </div>
  );
}
