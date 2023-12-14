// util/dateUtils.ts
import type * as Departures from '../types/departures-types'

export function convertIRISTime(dateStringArr: string[], item: Departures.Stop, arrival: boolean) {
  const dateString = arrival
    ? dateStringArr[0]
    : item.hasDeparture
    ? dateStringArr[1]
    : dateStringArr[0]
  const hour = Number(dateString.slice(6, 8)).toLocaleString('de-DE', {
    minimumIntegerDigits: 2,
    useGrouping: false
  })
  const minute = Number(dateString.slice(8, 10)).toLocaleString('de-DE', {
    minimumIntegerDigits: 2,
    useGrouping: false
  })
  return `${hour}:${minute}`
}

export function convertTimestamp(ts: string, date: boolean) {
  if (date) {
    return `${ts.slice(4, 6)}.${ts.slice(2, 4)}.${ts.slice(0, 2)}`
  }
  return `${ts.slice(6, 8)}:${ts.slice(8, 10)}`
}

export function calculateDelay(
  plannedTime: string[],
  currentTime: string[],
  item: Departures.Stop
) {
  const [plannedArr, plannedDep] = plannedTime
  const [currentArr, currentDep] = currentTime
  const currMins =
    parseInt((item.hasArrival ? currentArr : currentDep).slice(6, 8)) * 60 +
    parseInt((item.hasArrival ? currentArr : currentDep).slice(8, 10))
  const planMins =
    parseInt((item.hasArrival ? plannedArr : plannedDep).slice(6, 8)) * 60 +
    parseInt((item.hasArrival ? plannedArr : plannedDep).slice(8, 10))

  const delay = currMins - planMins
  if (delay < 0) {
    return delay
  }
  return delay
}
