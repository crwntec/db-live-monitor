import { v4 as uuidv4 } from "uuid";
import { hasLeft } from "@/util";
import StopBase from "./StopBase";
import { Stop } from "@/types/timetable";

export default function StopGroup({
  stopGroup,
  index,
}: {
  stopGroup: Stop[];
  index: number;
}) {
  return (
    <li
      key={stopGroup[0].transport.journeyID + uuidv4()}
      className={`${
        hasLeft(stopGroup[0], 0)
          ? "bg-gray-300 dark:bg-gray-900"
          : "hover:bg-gray-200 dark:hover:bg-gray-800"
      } border-b border-gray-700 animate-fadeIn`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <StopBase
        stop={stopGroup[0]}
        stopGroup={stopGroup}
        key={index}
        hasLeft={hasLeft(stopGroup[0], 0)}
        index={index}
      />
      {/*{stopGroup.map((stop, index) => (
        <StopBase
          stop={stop}
          stopGroup={stopGroup}
          key={index}
          hasLeft={hasLeft(stop, 0)}
          index={index}
        />
      ))}*/}
    </li>
  );
}
