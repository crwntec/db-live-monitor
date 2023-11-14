export interface Timetable {
  station: string
  stops: Stop[]
}

export interface Stop {
  tripId: string
  hafasRef: string
  hasHafasData: boolean
  himMessages: HimMessage[]
  qualityChanges: Message[]
  hasArrival: boolean
  hasDeparture: boolean
  hasNewArr: boolean
  hasNewTime: boolean
  when: string
  plannedWhen: string
  cancelled: boolean
  onlyPlanData: boolean
  causesOfDelay: Message[]
  hasNewPlatform: boolean
  platform: string
  plannedPlatform: string
  arrivalPath: string[]
  plannedPath: string[]
  currentPath: string[]
  removedStops: PathChange[]
  additionalStops: PathChange[]
  hasWings: boolean
  wing: Wing
  from: string
  to: string
  isEnding: boolean
  line: Line
  shouldScroll: boolean
}

export interface Wing {
  wing: string
  start: WingLocation
  end: WingLocation
}

export interface WingLocation {
  station: string
  plannedTime: string
}

export interface PathChange {
  id: string
  newStop: string
}

export interface Message {
  id: string
  cat: number
  text: string
  timestamp: string
}

export interface HimMessage {
  id: string
  t: T
  from?: string
  to?: string
  ts: string
  cat?: string
}

export enum T {
  C = 'c',
  H = 'h',
  R = 'r'
} 

export interface Line {
  fahrtNr: string
  name: string
  productName: string
  operator: string
}

export interface TrainOrder {
  baureihe: string
  trainId: string
  firstTrain: Train[]
  doubleTraction: boolean
  secondTrain: Train[]
  onlyPlanData: boolean
}

export interface Train {
  typ: string
  isLocomotive: boolean
  isPowercar: boolean
  class: Class
  baureihe: string
  ordnungsNummer?: string
  abschnitt: string
  austtattung: string[]
}

export enum Class {
  Halbspeisewagen2Klasse = 'Halbspeisewagen 2.Klasse',
  Klasse1 = '1. Klasse',
  Klasse2 = '2. Klasse'
}

export interface HafasData {
  origin: {
    name: string
  }
  destination: {
    name: string
  }
  departure: string
  plannedDeparture: string
  departureDelay: number
  arrival: string
  plannedArrival: string
  arrivalDelay: number
  line: {
    type: string
    id: string
    fahrtNr: string
    name: string
    productName: string
    mode: string
    product: string
    operator: {
      type: string
      id: string
      name: string
    }
  }
  direction: string
  currentLocation: {
    type: string
    latitude: number
    longitude: number
  }
  arrivalPlatform: string
  plannedArrivalPlatform: string
  arrivalPrognosisType: string
  departurePlatform: string
  plannedDeparturePlatform: string
  departurePrognosisType: string | null
  stopovers: Stopover[]
  remarks: Remark[]
  hints: Hint[]
  polyline: Number[][]
  stops: Object[]
}

export interface Stopover {
  stop: {
    type: string
    id: string
    name: string
    location: {
      type: string
      id: string
      latitude: number
      longitude: number
    }
    products: {
      [key: string]: boolean
    }
  }
  arrival: string | null
  plannedArrival: string | null
  arrivalDelay: number | null
  arrivalPlatform: string | null
  arrivalPrognosisType: string | null
  plannedArrivalPlatform: string | null
  departure: string | null
  plannedDeparture: string | null
  departureDelay: number | null
  departurePlatform: string | null
  departurePrognosisType: string | null
  plannedDeparturePlatform: string | null
  cancelled?: boolean
  remarks: Remark[]
}

interface Remark {
  id: string
  code: string | null
  type: string
  summary: string
  text: string
}

interface Hint {
  id: string
  code: string
  type: string
  summary: string
  text: string
}
