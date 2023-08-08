<!-- eslint-disable no-undef -->
<template>
  <div class="error" v-if="error">
    <h1 >{{ errorMsg }}</h1>
    <router-link to="/"><button class="errButton">Zurück</button></router-link>
  </div>
  <div v-if="!error" class="container">
    <h1 class="heading"><router-link to="/">{{ station }}</router-link></h1>
    <div class="stopsContainer">
      <trainDetailModal v-show="showModal" :data="modalData" :trainOrder="trainOrder" :station="station" @close-modal="hideModal" />
      <ul class="stops">
        <!-- <li :key="index" v-for="(item,index) in stops" class="stop" @click="displayModal(item)" >
          
        </li> -->
        <DynamicScroller
          :items="stops"
          :min-item-size="93"
          key-field="tripId"
          class="Scroller"
        >
          <template v-slot="{ item, active }">
            <DynamicScrollerItem
              :item="item"
              :active="active"
              @click="displayModal(item)"
            >
            <div :class="{stopRow:true, cancelled: item.cancelled}">
              <div class="lineContainer">
                <span class="line" :style="{backgroundColor: getColor(item.line.productName)}">{{ item.line.name }}
                </span>
              </div>
              <span class="direction">
                {{item.hasDeparture ? item.to : "von " + item.from }}
              </span>
              <div class="info">
                <span v-if="item.hasNewTime" class="originalTime">{{convertIRISTime(item.plannedWhen.split('|'), item, false)}}</span>
                <span class="when" :style="{'color': item.hasNewTime ? 'red' : 'rgb(138, 255, 127)'}">
                  {{ convertIRISTime(item.when.split('|'), item, false) }}
                  (+{{
                    calculateDelay(item.plannedWhen.split('|'), item.when.split('|'), item)
                  }})
                </span>
              </div>
              <div class="platform">
                  <span v-if="item.hasNewPlatform" :style="{'text-decoration': item.hasNewPlatform ? 'line-through' : ''}">{{ item.plannedPlatform }}</span>
                  <span :style="{'color': item.hasNewPlatform ? 'red' : 'white'}">{{ " " + item.platform }}</span>
              </div>
              <div
              class="messages"
              >
                <span class="delayCause">{{ getDelayMessage(item.causesOfDelay).join('++')}}</span>
                <span v-if="item.removedStops.length > 0 && !item.onlyPlanData">Ohne Halt in: <span :key="stop.id" v-for="stop in item.removedStops">{{ stop }}</span></span>
                <span v-if="item.additionalStops.length > 0">Hält zusätzlich in: <span :key="stop.id" v-for="stop in item.additionalStops">{{ stop }}</span></span>
              </div>
              {{ item.cancelled ? "Fahrt fällt aus!": "" }}
            </div>
            </DynamicScrollerItem>
          </template>
        </DynamicScroller>
      </ul>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import type * as Departures from '../departures-types'
import "../assets/monitor.css"
import "../assets/main.css"
import { trainCatColors } from '@/assets/trainCatColors'
import trainDetailModal from './train-detail-modal.vue'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'

export default defineComponent({
  name: 'Deps-List',
  components: {trainDetailModal},
  data: function () {
    return {
      connection: {} as WebSocket,
      stops: [] as Departures.Stop[],
      isScrollableArr: [] as Object[],
      station: '',
      error: false,
      errorMsg: '',
      refreshRate: 15000,
      showModal: false,
      modalData: null as unknown,
      trainOrder: null
    }
  },
  created: function () {
    console.log('Connecting to socket...')
    let ibnr = this.$route.params.station
    const station = this.$route.query.i || this.$route.path.replace('/','')
    // eslint-disable-next-line no-undef
    this.connection = new WebSocket(`${import.meta.env.DEV ? 'ws://127.0.0.1:8080': import.meta.env.VITE_BACKENDURI.replace(/https:\/{2}/g,'wss://')}/wss?station=${ibnr}&refreshRate=${this.refreshRate}`)

    this.connection.onmessage = (event: MessageEvent) => {
      if (event.data == 404) {
        this.error = true
        this.errorMsg = this.$route.query.i=='' ? 'Bitte Bahnhof eingeben' :`Für ${station} liegen keine Daten vor ` 
      } else {
        let data: Departures.Timetable = JSON.parse(event.data)
        let departures: Departures.Stop[] = data.stops

        this.station = data.station
        this.stops = departures
      }
    }
  },
  methods: {
    convertIRISTime(dateStringArr: string[], item: Departures.Stop, arrival: boolean) {
      //let dateString = item.hasDeparture ? dateStringArr[1] : dateStringArr[0]
      let dateString = arrival ? dateStringArr[0] : item.hasDeparture ? dateStringArr[1] : dateStringArr[0]
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
    convertTimestamp(ts: string, date: boolean) { 
      if (date) {
        return `${ts.slice(4,6)}.${ts.slice(2,4)}.${ts.slice(0,2)}`
      }
      return `${ts.slice(6,8)}:${ts.slice(8,10)}`
    },
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
    },
    getDelayMessage(dCauses: Departures.Message[]){
      let messages: string[]=[]
      dCauses.forEach((c)=>messages.push(c.text))
      return messages
    },
    async displayModal(data: Departures.Stop) {
      if (data.hasDeparture) {
        const res = await fetch(`${import.meta.env.DEV ? 'http://127.0.0.1:8080': import.meta.env.VITE_BACKENDURI}/wr/${data.line.fahrtNr}/${data.plannedWhen.split('|')[1]}`)
        if (res.status !== 204) {
          let resText = await res.text()
          this.trainOrder = JSON.parse(resText)
        }
      }
      this.modalData = data
      this.showModal = true
    },
    hideModal() {
      this.modalData = null
      this.trainOrder = null
      this.showModal = false
    }
  },
  unmounted: function () {
    this.connection.close()
  }
})
</script>
<style></style>
