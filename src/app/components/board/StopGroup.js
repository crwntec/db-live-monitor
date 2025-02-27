import { v4 as uuidv4 } from "uuid";
import { hasLeft } from "@/util";
import StopBase from "./StopBase";

export default function StopGroup({ stopGroup, index }) {
  return (
    <li
      key={stopGroup[0].train.id + uuidv4()}
      className={`${hasLeft(stopGroup[0],0) ? "bg-gray-900" : "hover:bg-gray-800"} border-b border-gray-700 animate-fadeIn`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {stopGroup.map((stop, index) => (
        <StopBase stop={stop} stopGroup={stopGroup} key={index} hasLeft={hasLeft(stop,0)} index={index} />
      ))}
    </li>
  );
}
