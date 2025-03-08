import { IrisMessage, IrisPathItem, IrisWing } from "./iris";

export interface WebAPIResult {
  evaNo: string;
  stationName: string;
  isArrival?: boolean;
  items: WebAPIStop[];
}

export interface WebAPIStop {
  train: WebAPITrain;
  category: string;
  time: string;
  timePredicted: string;
  diff: number;
  timeType: "REAL" | "PREDICTED" | "IRIS_PLANNED" | "IRIS_PREDICTED";
  platform: string;
  platformPredicted: string;
  administration: Administration;
  canceled: boolean;
  departureId?: string;
  arrivalId?: string;
  destination?: Destination;
  origin?: Destination;
}

export interface StopTime {
    diff: number;
    time: string;
    timePredicted: string;
}

export interface WebAPITrain {
  journeyId: string | null;
  category: string;
  type: string;
  no: number;
  lineName: string;
}

export interface Administration {
    id: string;
    operatorCode: string;
    operatorName: string;   
}

export interface Destination {
    evaNo?: string;
    name: string;
    canceled?: boolean;
}

export interface StationData {
    evaNo: string
    stationName: string
    stationNames: string[]
    stopGroups: Stop[][]
}

export interface Stop {
    irisOverride: boolean
    irisId: string
    train: WebAPITrain & { id: string }
    wing: IrisWing | null
    arrival: WebAPIStop & {path: IrisPathItem[], origin: { name: string }} | null
    departure: WebAPIStop & {path: IrisPathItem[], destination: { name: string }} | null
    delayMessages: IrisMessage[]
    qualityChanges: IrisMessage[]
    canceled: boolean
}
