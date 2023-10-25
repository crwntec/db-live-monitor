<!-- eslint-disable no-undef -->
<template>
  <div class="error" v-if="error">
    <h1>{{ errorMsg }}</h1>
    <router-link to="/"><button class="errButton">Zurück</button></router-link>
  </div>
  <div v-if="!error" class="container">
    <div class="pageHeader">
      <h1 class="heading"><router-link to="/">{{ station }}</router-link></h1>
      <div class="headerIcons">
        <font-awesome-icon class="headerIcon settingsIcon" icon="gear" size="lg" @click="showSettings = !showSettings" />
      </div>
    </div>
    <div class="settingsModal" :class="{ 'show': showModal }" v-if="showSettings">
      <div class="settingsHeader">
        <h2>Einstellungen</h2>
        <font-awesome-icon class="exit" icon="xmark" size="lg" @click="closeSettings" />
      </div>
      <div class="settings-option">
        <label>
          Zugnummern anzeigen
          <input type="checkbox" v-model="showLineNumbers" />
        </label>
      </div>
      <div class="settings-option">
        <label>
          Sortieren nach:
          <select class="selectOption" v-model="sortBy">
            <option value="departure">Abfahrtszeit</option>
            <option value="arrival">Ankunftszeit</option>
          </select>
          <select class="selectOption" v-model="sortOption">
            <option value="when">Aktueller {{ sortBy == "departure" ? 'Abfahrtszeit' : 'Ankunftszeit' }}</option>
            <option value="plannedWhen">Ursprünglicher {{ sortBy == "departure" ? 'Abfahrtszeit' : 'Ankunftszeit' }}
            </option>
          </select>
        </label>
      </div>
      <div class="footer">
        <p>Aktuelle Version: <a class="link" href="https://github.com/crwntec/db-live-monitor">{{ version }}</a></p>
        <p>Letzte Datenaktualisierung: {{ lastUpdate.toLocaleTimeString('de-DE') }}</p>
      </div>
    </div>
    <div class="stopsContainer">
      <trainDetailModal v-show="showModal" :show-modal="showModal" :data="modalData" :trainOrder="trainOrder"
        :station="station" @close-modal="hideModal" @updateModalData="handleUpdate" />
      <ul class="stops">
        <DynamicScroller :items="stops" :min-item-size="93" key-field="tripId" class="Scroller">
          <template v-slot="{ item, active }">
            <DynamicScrollerItem :item="item" :active="active" @click="displayModal(item)">
              <div :class="{ stopRow: true, cancelled: item.cancelled, hasLeft: item.hasLeft }">
                <div class="lineContainer">
                  <span class="line" :style="{ backgroundColor: getColor(item.line.productName) }">{{ item.line.name }}
                    <span
                      v-if="showLineNumbers && (!item.line.productName.includes('IC')) && item.line.productName.slice(0, 2) !== 'EC'"
                      class="trainNumber">{{ item.line.fahrtNr }}</span>
                  </span>
                </div>
                <span class="direction">
                  {{ item.hasDeparture ? item.to : "von " + item.from }}
                </span>
                <div class="info">
                  <span v-if="item.hasNewTime" class="originalTime">{{ convertIRISTime(item.plannedWhen.split('|'), item,
                    false) }}</span>
                  <span class="when" :style="{ 'color': getTimeColor(item) }">
                    {{ convertIRISTime(item.when.split('|'), item, false) }}
                    ({{ calculateDelay(item.plannedWhen.split('|'), item.when.split('|'), item) >= 0 ? '+' +
                      calculateDelay(item.plannedWhen.split('|'), item.when.split('|'), item) :
                      calculateDelay(item.plannedWhen.split('|'), item.when.split('|'), item) }})
                  </span>
                </div>
                <div class="platform">
                  <span v-if="item.hasNewPlatform"
                    :style="{ 'text-decoration': item.hasNewPlatform ? 'line-through' : '' }">{{ item.plannedPlatform
                    }}</span>
                  <span :style="{ 'color': item.hasNewPlatform ? 'red' : 'white' }">{{ " " + item.platform }}</span>
                </div>
                <div class="messages">
                  <span class="delayCause">{{ getDelayMessage(item.causesOfDelay).join('++') }}</span>
                  <span v-if="item.removedStops.length > 0 && !item.onlyPlanData">Ohne Halt in: <span :key="stop.id"
                      v-for="stop in item.removedStops">{{ stop.stop }}</span></span>
                  <span v-if="item.additionalStops.length > 0">Hält zusätzlich in: <span :key="stop.id"
                      v-for="stop in item.additionalStops">{{ stop }}</span></span>
                </div>
                {{ item.cancelled ? "Fahrt fällt aus!" : "" }}
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
import type * as Departures from '../types/departures-types'
import "../assets/monitor.css"
import "../assets/main.css"
import { trainCatColors } from '@/assets/trainCatColors'
import trainDetailModal from './train-detail-modal.vue'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import pjson from "../../package.json"



export default defineComponent({
  name: 'Deps-List',
  components: { trainDetailModal },
  created: function () {
    let ibnr = this.$route.params.station
    const station = this.$route.query.i || this.$route.path.replace('/', '')
    // eslint-disable-next-line no-undef
    this.connection = new WebSocket(`${import.meta.env.DEV ? 'ws://127.0.0.1:8080' : import.meta.env.VITE_BACKENDURI.replace(/https:\/{2}/g, 'wss://')}/wss?station=${ibnr}&refreshRate=${this.refreshRate}`)

    this.connection.onmessage = (event: MessageEvent) => {
      if (event.data == 404) {
        this.error = true
        this.errorMsg = this.$route.query.i == '' ? 'Bitte Bahnhof eingeben' : `Für ${station} liegen keine Daten vor `
      } else {
        this.lastUpdate = new Date(Date.now())
        let data: Departures.Timetable = JSON.parse(event.data)
        let departures: Departures.Stop[] = data.stops

        this.station = data.station
        this.stops = departures.sort((a, b) => this.sortStops(a, b))
      }
    }
  },
  data() {
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
      trainOrder: null,
      showSettings: false,
      showLineNumbers: sessionStorage.getItem('showLineNumbers') === "true" || false,
      sortOption: sessionStorage.getItem('sortOption') || "when",
      sortBy: sessionStorage.getItem('sortBy') || "departure",
      version: pjson.version,
      lastUpdate: new Date(Date.now())
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
        return `${ts.slice(4, 6)}.${ts.slice(2, 4)}.${ts.slice(0, 2)}`
      }
      return `${ts.slice(6, 8)}:${ts.slice(8, 10)}`
    },
    calculateDelay(plannedTime: string[], currentTime: string[], item: Departures.Stop) {
      let [plannedArr, plannedDep] = plannedTime
      let [currentArr, currentDep] = currentTime
      const currMins = parseInt((item.hasArrival ? currentArr : currentDep).slice(6, 8)) * 60 + parseInt((item.hasArrival ? currentArr : currentDep).slice(8, 10))
      const planMins = parseInt((item.hasArrival ? plannedArr : plannedDep).slice(6, 8)) * 60 + parseInt((item.hasArrival ? plannedArr : plannedDep).slice(8, 10))

      const delay = currMins - planMins
      if (delay < 0) {
        return delay
      }
      return delay
    },
    getColor(prodName: string) {
      const p = prodName.toLowerCase();
      switch (true) {
        case p.includes('via'):
          return trainCatColors.VIAS;
        case p.includes('flx'):
          return trainCatColors.FLX;
        case p.charAt(0) == 't':
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
        case p.charAt(0) == 's':
          return trainCatColors.SBAHN;
        case p.includes('ic'):
        case p.includes('ec'):
          return trainCatColors.LONGDISTANCE;
        case p.includes('bus'):
          return trainCatColors.BUS;
      }
    },
    getTimeColor(item: Departures.Stop) {
      const delay = this.calculateDelay(item.plannedWhen.split('|'), item.when.split('|'), item)

      if (delay < 0) {
        return 'rgb(66, 217, 255)'
      }
      if (delay == 0) {
        return 'rgb(138, 255, 127)'
      } else if (delay <= 5) {
        return 'rgb(235, 200, 7)'
      } else if (delay <= 10) {
        return 'rgb(255, 161, 66)'
      } else if (delay > 10) {
        return 'rgb(255, 66, 66)'
      }
    },
    getDelayMessage(dCauses: Departures.Message[]) {
      let messages: string[] = []
      dCauses.forEach((c) => messages.push(c.text))
      return messages
    },
    getTripById(id: string) {
      return this.stops.find(o => o.tripId.includes(id)) || null
    },
    handleUpdate(newData: Departures.Stop) {
      this.hideModal()
      this.displayModal(newData)
    },
    async displayModal(data: Departures.Stop) {
      if (data.hasDeparture) {
        const wr = await fetch(`${import.meta.env.DEV ? 'http://127.0.0.1:8080' : import.meta.env.VITE_BACKENDURI}/wr/${data.line.fahrtNr}/${data.plannedWhen.split('|')[1]}`)

        if (wr.status !== 204) {
          let resText = await wr.text()
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
    },
    closeSettings() {
      this.showSettings = false
      this.stops = this.stops.sort((a, b) => this.sortStops(a, b))
      sessionStorage.setItem('showLineNumbers', this.showLineNumbers.toString())
      sessionStorage.setItem('sortBy', this.sortBy)
      sessionStorage.setItem('sortOption', this.sortOption)
    },
    sortStops(a: Departures.Stop, b: Departures.Stop) {
      if (this.sortOption == "when") {
        if (this.sortBy == "departure") {
          return parseInt(a.hasDeparture ? a.when.split("|")[1] : a.when.split("|")[0]) - parseInt(b.hasDeparture ? b.when.split("|")[1] : b.when.split("|")[0])
        }
        return parseInt(a.hasArrival ? a.when.split("|")[0] : a.when.split("|")[1]) - parseInt(b.hasDeparture ? b.when.split("|")[0] : b.when.split("|")[1])
      }
      if (this.sortBy == "departure") {
        return parseInt(a.hasDeparture ? a.plannedWhen.split("|")[1] : a.plannedWhen.split("|")[0]) - parseInt(b.hasDeparture ? b.plannedWhen.split("|")[1] : b.plannedWhen.split("|")[0])
      }
      return parseInt(a.hasArrival ? a.plannedWhen.split("|")[0] : a.plannedWhen.split("|")[1]) - parseInt(b.hasDeparture ? b.plannedWhen.split("|")[0] : b.plannedWhen.split("|")[1])
    }
  },
  unmounted() {
    this.connection.close()
  }
})
</script>
<style></style>
