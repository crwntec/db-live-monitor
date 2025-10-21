import { trainCatColors } from "@/app/assets/trainCatColors";

export function getColor(prodName: string) {
  const p = prodName.toLowerCase();
  switch (true) {
    case p.includes("via"):
      return trainCatColors.VIAS;
    case p.includes("flx"):
      return trainCatColors.FLX;
    case p.charAt(0) == "t":
      return trainCatColors.SNCF;
    case p.includes("nj"):
    case p.includes("rj"):
      return trainCatColors.ÖBB;
    case p.includes("sbb"):
      return trainCatColors.SBB;
    case p.includes("akn"):
      return trainCatColors.AKN;
    case p.includes("alx"):
      return trainCatColors.ALX;
    case p.includes("brb"):
    case p.includes("nwb"):
    case p.includes("mrb"):
    case p.includes("weg"):
      return trainCatColors.TRANSDEV;
    case p.includes("be"):
      return trainCatColors.BE;
    case p.includes("me"):
    case p.includes("eno"):
      return trainCatColors.METRONOM;
    case p.includes("erb"):
      return trainCatColors.ERB;
    case p.includes("erx"):
      return trainCatColors.ERX;
    case p.includes("hzl"):
      return trainCatColors.HZL;
    case p.includes("nbe"):
      return trainCatColors.NBE;
    case p.includes("nob"):
      return trainCatColors.NOB;
    case p.includes("rt"):
      return trainCatColors.RT;
    case p.includes("rtb"):
      return trainCatColors.RTB;
    case p.includes("wfb"):
      return trainCatColors.WFB;
    case p.includes("neg"):
      return trainCatColors.NEG;
    case p.includes("est"):
      return trainCatColors.EST;
    case p.includes("re"):
    case p.includes("rb"):
      return trainCatColors.REGIONAL;
    case p.charAt(0) == "s":
      return trainCatColors.SBAHN;
    case p.includes("ic"):
    case p.includes("ec"):
      return trainCatColors.LONGDISTANCE;
    case p.includes("bus"):
      return trainCatColors.BUS;
    default:
      return "default-color"; // Add a default color if none of the cases match
  }
}

export function getDelayColor(delay: number | null, minutes = false) {
  if (delay == null) return " text-gray-500";
  if (minutes) delay = delay * 60;
  if (delay < 0) {
    return " text-cyan-500";
  } else if (delay < 60) {
    return " text-green-500";
  } else if (delay < 360) {
    return " text-yellow-500";
  } else if (delay < 720) {
    return " text-orange-500";
  } else if (delay < 1800) {
    return " text-red-500";
  } else if (delay > 1800) {
    //TODO: add a different color for delays over 30 minutes
    return " text-red-500";
  } else {
    return "text-gray-500";
  }
}
