<!-- eslint-disable no-undef -->
<template>
  <div class="error" v-if="error">
    <h1>{{ errorMsg }}</h1>
    <router-link to="/"><button class="errButton">{{ $t("monitorView.back") }}</button></router-link>
  </div>
  <div v-if="!error" class="container">
    <div v-if="!loading" class="pageHeader">
      <h1 class="heading"><router-link to="/">{{ station }}</router-link></h1>
      <div class="headerIcons">
        <font-awesome-icon class="headerIcon settingsIcon" icon="gear" size="lg" @click="showSettings = !showSettings" />
      </div>
    </div>
    <div v-if="loading" class="loadingContainer">
      <div class="progress"></div>
    </div>
    <div class="settingsModal" :class="{ 'show': showModal }" v-if="showSettings">
      <form action="#">
        <div class="settingsHeader">
          <h2>{{ $t("monitorView.settings") }}</h2>
          <font-awesome-icon class="exit" icon="xmark" size="lg" @click="closeSettings" />
        </div>
        <div class="settings-option">
          <label>
            {{ $t("monitorView.showTrainNumbers") }}
            <input type="checkbox" v-model="showLineNumbers" />
          </label>
        </div>
        <div class="settings-option">
          <label>
            {{ $t("monitorView.sortBy") }}
            <select class="selectOption" v-model="sortBy">
              <option value="departure">{{ $t("monitorView.departureTime") }}</option>
              <option value="arrival">{{ $t("monitorView.arrivalTime") }}</option>
            </select>
            <select class="selectOption" v-model="sortOption">
              <option value="when">{{ $t("monitorView.current") }} {{ sortBy == "departure" ? $t("monitorView.departureTime") :
                $t("monitorView.arrivalTime")  }}</option>
              <option value="plannedWhen">{{ $t("monitorView.planned") }} {{ sortBy == "departure" ?  $t("monitorView.departureTime") :
                 $t("monitorView.arrivalTime") }}
              </option>
            </select>
          </label>
        </div>
        <div class="settings-option">
          <label>{{ $t("monitorView.refreshRate") }}
            <input class="refreshRate" type="number" v-model="refreshRate" min="5" max="30">
          </label>
        </div>
        <div class="settings-option">
          <label>{{ $t("monitorView.language") }} <select class="selectOption" v-model="language">
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select></label>
        </div>
        <div class="footer">
          <p>{{ $t("monitorView.currentVersion") }}: <a class="link" href="https://github.com/crwntec/db-live-monitor">{{
            version }}</a></p>
          <p>{{ $t("monitorView.lastDataUpdate") }}: {{ lastUpdate.toLocaleTimeString('de-DE') }}</p>
          <button type="submit" class="save" @click="closeSettings">{{ $t("monitorView.applySettings") }}</button>
        </div>
      </form>
    </div>
    <div class="stopsContainer">
      <ul class="stops">
        <DynamicScroller :items="stops" :min-item-size="93" key-field="tripId" class="Scroller">
          <template v-slot="{ item, active }">
            <DynamicScrollerItem :item="item" :active="active" @click="openDetails(item)">
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
import "../assets/loading.css"
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import * as DateUtil from "../util/date"
import * as ColorUtil from "../util/colors"
import pjson from "../../package.json"



export default defineComponent({
  name: 'Monitor-View',
  created: function () {
    let ibnr = this.$route.params.station
    const station = this.$route.query.i || this.$route.path.replace('/', '')
    // eslint-disable-next-line no-undef
    this.connection = new WebSocket(`${import.meta.env.DEV ? 'ws://127.0.0.1:8080' : import.meta.env.VITE_BACKENDURI.replace(/https:\/{2}/g, 'wss://')}/wss?station=${ibnr}&refreshRate=${this.refreshRate * 1000}`)

    this.connection.onmessage = (event: MessageEvent) => {
      this.loading = false
      if (event.data == 404) {
        this.error = true
        this.errorMsg = this.$route.query.i == '' ? 'Bitte Bahnhof eingeben' : `Für ${station} liegen keine Daten vor `
      } else {
        this.lastUpdate = new Date(Date.now())
        let data: Departures.Timetable = JSON.parse(event.data)
        let departures: Departures.Stop[] = data.stops

        this.station = data.station
        localStorage.setItem('scopedStation', data.station)
        this.stops = departures.sort((a, b) => this.sortStops(a, b))
        localStorage.setItem('scopedStops', JSON.stringify(this.stops))
      }
    }
  },
  data() {
    return {
      connection: {} as WebSocket,
      loading: true,
      stops: [] as Departures.Stop[],
      isScrollableArr: [] as Object[],
      station: '',
      error: false,
      errorMsg: '',
      refreshRate: Number(sessionStorage.getItem('refreshRate')) || 15,
      showModal: false,
      modalData: null as unknown,
      trainOrder: null,
      showSettings: false,
      showLineNumbers: sessionStorage.getItem('showLineNumbers') === "true" || false,
      sortOption: sessionStorage.getItem('sortOption') || "when",
      sortBy: sessionStorage.getItem('sortBy') || "departure",
      language: sessionStorage.getItem('language') || "de",
      version: pjson.version,
      lastUpdate: new Date(Date.now())
    }
  },
  methods: {
    convertIRISTime: DateUtil.convertIRISTime,
    convertTimestamp: DateUtil.convertTimestamp,
    calculateDelay: DateUtil.calculateDelay,
    getColor: ColorUtil.getColor,
    getTimeColor: ColorUtil.getTimeColor,
    getDelayMessage: ColorUtil.getDelayMessage,
    getTripById: ColorUtil.getTripById,
    openDetails(item: Departures.Stop) {
      localStorage.setItem('scopedItem', JSON.stringify(item))
      this.$router.push({
        name: 'details'
      })
    },
    closeSettings() {
      this.showSettings = false
      this.stops = this.stops.sort((a, b) => this.sortStops(a, b))
      sessionStorage.setItem('showLineNumbers', this.showLineNumbers.toString())
      sessionStorage.setItem('sortBy', this.sortBy)
      sessionStorage.setItem('sortOption', this.sortOption)
      sessionStorage.setItem('refreshRate', this.refreshRate.toString())
      sessionStorage.setItem('language', this.language)
      this.$i18n.locale=this.language
      
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
