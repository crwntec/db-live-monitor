<template>
  <div>
    <h1 v-if="error">{{ errorMsg }}</h1>
  </div>
  <div v-if="!error" class="container">
    <h1 class="heading">{{ station }}</h1>
    <li :key="item.tripId" v-for="item in stops" class="stop" >
      <div :class="{stopRow:true, cancelled: item.cancelled}">
        <span :class="{
            line:true, regional: item.line.productName.charAt(0)=='R', 
            sbahn: item.line.productName.charAt(0)=='S', 
            longDistance: item.line.productName.charAt(0)=='I' || item.line.productName.charAt(0)=='E',
            vias: item.line.productName.charAt(0)=='V',
            flx: item.line.productName.charAt(0)=='F',
            tha: item.line.productName.charAt(0)=='T'
            }">{{ item.line.name }}
        </span>
        <span class="direction">
          {{ item.direction }}
        </span>
        <div class="info">
          <span v-if="item.hasNewTime" class="originalTime">{{convertIRISTime(item.plannedWhen.split('|'), item)}}</span>
          <span class="when" :style="{'color': item.hasNewTime ? 'red' : 'rgb(138, 255, 127)'}">
            {{ convertIRISTime(item.when.split('|'), item) }}
            (+{{
              calculateDelay(item.plannedWhen.split('|'), item.when.split('|'), item)
            }})
          </span>
          
          <span class="platform">
            <span :style="{'color': item.hasNewPlatform ? 'red' : 'white'}">{{ item.platform }}</span>
          </span>
        </div>
        <div class="messages">
          <span class="delayCause" :key="cause.id" v-for="cause in item.causesOfDelay">{{ item.causesOfDelay[item.causesOfDelay.length-1].id != cause.id ? cause.text + '++' : cause.text }}</span>
          <span v-if="item.removedStops.length > 0 && !item.onlyPlanData">Ohne Halt in: <span :key="stop.id" v-for="stop in item.removedStops">{{ stop }}</span></span>
          <span v-if="item.additionalStops.length > 0">Hält zusätzlich in: <span :key="stop.id" v-for="stop in item.additionalStops">{{ stop }}</span></span>
        </div>
        {{ item.cancelled ? "Fahrt fällt aus!": "" }}
      </div>
    </li>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import type * as Departures from '../departures-types'
import "../assets/main.css"

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
