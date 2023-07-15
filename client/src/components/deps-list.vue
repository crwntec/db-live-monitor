<!-- eslint-disable no-undef -->
<template>
  <div class="error">
    <h1 v-if="error">{{ errorMsg }}</h1>
    <router-link to="/"><button class="errButton">Zurück</button></router-link>
  </div>
  <div v-if="!error" class="container">
    <h1 class="heading">{{ station }}</h1>
    <li :key="item.tripId" v-for="item in stops" class="stop" >
      <div :class="{stopRow:true, cancelled: item.cancelled}">
        <span class="line" :style="{backgroundColor: getColor(item.line.productName)}">{{ item.line.name }}
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
import "../assets/monitor.css"
import "../assets/main.css"
import { trainCatColors } from '@/assets/trainCatColors'

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
    let ibnr = this.$route.params.station
    const station= this.$route.query.i
    // eslint-disable-next-line no-undef
    this.connection = new WebSocket(`wss://${import.meta.env.VITE_BACKENDURI}/wss?station=${ibnr}`)

    this.connection.onmessage = (event: MessageEvent) => {
      if (event.data == 404) {
        this.error = true
        this.errorMsg = `${station} ist kein bekannter Bahnhof`
      } else {
        let data: Departures.Timetable = JSON.parse(event.data)
        let departures: Departures.Stop[] = data.stops

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
    },
    getColor(prodName: string) {
      const p = prodName.toLowerCase();
      switch(true) {
        case p.includes('via'):
          return trainCatColors.VIAS;
        case p.includes('flx'):
          return trainCatColors.FLX;
        case p.charAt(0)=='t':
          return trainCatColors.SNCF;
        case p.includes('nj'):
        case p.includes('rj'):
          return trainCatColors.ÖBB;
        case p.includes('sbb'):
          return trainCatColors.SBB;
        case p.includes('akn'):
          return trainCatColors.AKN;
        case p.includes('alx'):
          return trainCatColors.ALX;
        case p.includes('brb'):
        case p.includes('nwb'):
        case p.includes('mrb'):
        case p.includes('weg'):
          return trainCatColors.TRANSDEV;
        case p.includes('be'):
          return trainCatColors.BE;
        case p.includes('me'):
        case p.includes('eno'):
          return trainCatColors.METRONOM;
        case p.includes('erb'):
          return trainCatColors.ERB;
        case p.includes('erx'):
          return trainCatColors.ERX;
        case p.includes('hzl'):
          return trainCatColors.HZL;
        case p.includes('nbe'):
          return trainCatColors.NBE;
        case p.includes('nob'):
          return trainCatColors.NOB;
        case p.includes('rt'):
          return trainCatColors.RT;
        case p.includes('rtb'):
          return trainCatColors.RTB;
        case p.includes('wfb'):
          return trainCatColors.WFB;
        case p.includes('neg'):
          return trainCatColors.NEG;
         case p.includes('re'):
        case p.includes('rb'):
          return trainCatColors.REGIONAL;
        case p.charAt(0)=='s':
          return trainCatColors.SBAHN;
        case p.includes('ic'):
        case p.includes('ec'):
          return trainCatColors.LONGDISTANCE;
        case p.includes('bus'):
          return trainCatColors.BUS;
      }
    }
  },
  unmounted: function () {
    this.connection.close()
  }
})
</script>
<style></style>
