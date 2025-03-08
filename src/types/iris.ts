export interface IrisTimetable {
  declaration: any;
  elements: TimetableElement[];
}

export interface TimetableElement {
  attributes: {
    station: string;
  };
  elements: TimetableElementDetail[];
}

export interface TimetableElementDetail {
  attributes: TimetableElementAttributes;
  elements: NestedElement[];
}

export interface TimetableElementAttributes {
  id: string;
}

export interface NestedElement {
  type: string;
  name: string;
  attributes: IrisElementAttributes;
}

export interface IrisFchg {
  elements: IrisFchgElement[];
}

export interface IrisFchgElement {
  type: string;
  name: string;
  attributes: IrisFchgAttributes;
  elements: IrisFchgElementDetail[];
}

export interface IrisFchgAttributes {
  station: string;
  eva: string;
}

export interface IrisFchgElementDetail {
  type: string;
  name: string;
  attributes?: IrisElementAttributes;
  elements?: IrisFchgElementDetail[];
}

export interface IrisElementAttributes {
  ct?: string;
  l?: string;
  id?: string;
  t?: string;
  from?: string;
  to?: string;
  cat?: string;
  ts?: string;
  "ts-tts"?: string;
  pr?: string;
  cp?: string;
  cpth?: string;
  ppth?: string;
  pp?: string;
  pt?: string;
  f?: string;
  o?: string;
  c?: string;
  n?: string;
  del?: string;
  cs?: string;
  clt?: string;
  wings: string;
}

export interface IrisWingdef {
  elements: WingedefElement[];
}

export interface WingedefElement {
  elements: WingdefElementDetail[];
}

export interface WingdefElementDetail {
  name: "start" | "end";
  attributes: {
    eva: string;
    "st-name": string;
    pt: string;
    fl: string;
  };
}

export interface IrisResult {
  station: string;
  stops: IrisStop[];
}

export interface IrisStop {
  tripId: string;
  hasArrival: boolean;
  hasDeparture: boolean;
  when: {
    arrival: string;
    departure: string;
  };
  plannedWhen: {
    arrival: string;
    departure: string;
  };
  canceled: boolean;
  delayMessages: IrisMessage[];
  qualityChanges: IrisMessage[];
  onlyPlanData: boolean;
  platform?: string;
  plannedPlatform?: string;
  hasWings: boolean;
  wing?: IrisWing;
  from: string;
  to: string;
  arrivalPath: IrisPathItem[];
  departurePath: IrisPathItem[];
  line: {
    fahrtNr: string;
    name: string;
    productName: string;
    operator: string;
  };
}

export interface IrisPathItem {
  name: string;
  relevance: number;
}

export interface IrisMessage {
  text: string;
  timestamp: Date;
}

export interface IrisWing {
  origin: string;
  wing: string;
  start: { station: string; pt: string };
  end: { station: string; pt: string };
}
