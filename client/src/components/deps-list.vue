<template>
  <div>
    <h1 v-if="error">{{ errorMsg }}</h1>
  </div>
  <div v-if="!error">
    <h1>{{ station }}</h1>
    <li :key="item.tripId" v-for="item in stops">
      {{ item.line.name }} {{ item.hasDeparture ? 'nach' : '' }} {{ item.direction }} um
      {{ convertIRISTime(item.plannedWhen.split('|'), item) }} heute:
      {{ convertIRISTime(item.when.split('|'), item) }} (+{{
        calculateDelay(item.plannedWhen.split('|'), item.when.split('|'), item)
      }}) || <span :key="cause.id" v-for="cause in item.causesOfDelay"> {{ convertTimestamp(cause.timestamp) }} : {{cause.text}} || </span>
    </li>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import type * as Departures from '../departures-types'

export default defineComponent({
  name: 'Deps-List',
  data: function () {
    return {
      connection: {} as WebSocket,
      stops: [] as Departures.Stop[],
      station: '',
      error: false,
      errorMsg: ''
    }
  },
  created: function () {
    console.log('Connecting to socket...')
    let station = this.$route.params.station
    this.connection = new WebSocket(`ws:localhost:8080/${station}`)

    this.connection.onmessage = (event: MessageEvent) => {
      //console.log(event.data);
      if (event.data == 404) {
        this.error = true
        this.errorMsg = `${station} is not a valid station`
      } else {
        let data: Departures.Timetable = JSON.parse(event.data)
        let departures: Departures.Stop[] = data.stops
        //console.log(departures);

        this.station = data.station
        this.stops = departures
      }
    }
  },
  methods: {
    convertIRISTime(dateStringArr: string[], item: Departures.Stop) {
      let dateString = item.hasDeparture ? dateStringArr[1] : dateStringArr[0]
      const hour = Number(dateString.slice(6, 8)).toLocaleString('de-DE', {
        minimumIntegerDigits: 2,
        useGrouping: false
      })
      const minute = Number(dateString.slice(8, 10)).toLocaleString('de-DE', {
        minimumIntegerDigits: 2,
        useGrouping: false
      })
      return `${hour}:${minute}`
    },
    convertTimestamp(ts: string) { return `${ts.slice(6,8)}:${ts.slice(8,10)}`},
    calculateDelay(plannedTime: string[], currentTime: string[], item: Departures.Stop) {
      let [plannedArr, plannedDep] = plannedTime
      let [currentArr, currentDep] = currentTime
      const delay = (
        (parseInt(item.hasArrival ? currentArr : currentDep) -
          parseInt(item.hasArrival ? plannedArr : plannedDep)) /
        100
      ).toFixed(2)
      const hour = parseInt(delay.toString().split('.')[0])
      const minute = parseInt(delay.toString().split('.')[1])

      return (hour / 60 + minute).toFixed(0)
    }
  },
  unmounted: function () {
    this.connection.close()
  }
})
</script>
<style></style>
