// util/dateUtils.ts
import type * as Departures from '../types/departures-types'

export function convertDateToIRIS(dateString: string) {
  const date = new Date(dateString);

  const year = date.getFullYear().toString().substr(-2); // gets the last two digits of the year
  const month = ('0' + (date.getMonth() + 1)).slice(-2); // gets the month (0-11, so add 1), pads with 0 if necessary
  const day = ('0' + date.getDate()).slice(-2); // gets the day of the month, pads with 0 if necessary
  const hours = ('0' + date.getHours()).slice(-2); // gets the hours, pads with 0 if necessary
  const minutes = ('0' + date.getMinutes()).slice(-2); // gets the minutes, pads with 0 if necessary

  const formattedDate = year + month + day + hours + minutes;

  return formattedDate;
}

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
