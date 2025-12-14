import { trainCatColors } from "@/app/assets/trainCatColors";

// Define patterns in priority order (more specific first)
const colorMap = new Map<string, string>([
    // Specific operators (check before generic patterns)
    ["via", trainCatColors.VIAS],
    ["flx", trainCatColors.FLX],
    ["sbb", trainCatColors.SBB],
    ["akn", trainCatColors.AKN],
    ["alx", trainCatColors.ALX],
    ["nj", trainCatColors.ÖBB],
    ["rj", trainCatColors.ÖBB],
    ["brb", trainCatColors.TRANSDEV],
    ["nwb", trainCatColors.TRANSDEV],
    ["mrb", trainCatColors.TRANSDEV],
    ["weg", trainCatColors.TRANSDEV],
    ["be", trainCatColors.BE],
    ["me", trainCatColors.METRONOM],
    ["eno", trainCatColors.METRONOM],
    ["erb", trainCatColors.ERB],
    ["erx", trainCatColors.ERX],
    ["hzl", trainCatColors.HZL],
    ["nbe", trainCatColors.NBE],
    ["nob", trainCatColors.NOB],
    ["rtb", trainCatColors.RTB],
    ["rt", trainCatColors.RT],
    ["wfb", trainCatColors.WFB],
    ["neg", trainCatColors.NEG],
    ["est", trainCatColors.EST],
    ["wb", trainCatColors.WB],
    ["nx", trainCatColors.NX],
    ["rrb", trainCatColors.TRANSDEV],
    ["arv", trainCatColors.ARV],
    ["rb", trainCatColors.REGIONAL],
    ["re", trainCatColors.REGIONAL],
    ["r", trainCatColors.REGIOBAHN],

    // Generic patterns (check after specific)
    ["ic", trainCatColors.LONGDISTANCE],
    ["ec", trainCatColors.LONGDISTANCE],
    ["bus", trainCatColors.BUS],
]);

const startsWithT = (p: string) => p.charAt(0) === "t";
const startsWithS = (p: string) => p.charAt(0) === "s";

export function getColor(prodName: string): string {
    const p = prodName.toLowerCase();

    if (startsWithT(p)) return trainCatColors.SNCF;

    for (const [key, color] of colorMap) {
        if (p.startsWith(key)) {
            return color;
        }
    }

    if (startsWithS(p)) return trainCatColors.SBAHN;

    return "default-color";
}
export function getDelayColor(delay: number | null, minutes = false) {
  if (delay == null) return " text-gray-500";
  if (minutes) delay = delay * 60;
  if (delay < 0) {
    return "text-cyan-600 dark:text-cyan-500";
  } else if (delay < 60) {
    return "text-green-600 dark:text-green-500";
  } else if (delay < 360) {
    return "text-yellow-600 dark:text-yellow-500";
  } else if (delay < 720) {
    return "text-orange-600 dark:text-orange-500";
  } else if (delay < 1800) {
    return "text-red-600 dark:text-red-500";
  } else if (delay > 1800) {
    //TODO: add a different color for delays over 30 minutes
    return "text-red-600 dark:text-red-500";
  } else {
    return "text-gray-500";
  }
}
