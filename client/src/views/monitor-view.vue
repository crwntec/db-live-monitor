<!-- eslint-disable no-undef -->
<template>
  <div class="error" v-if="error">
    <h1>{{ errorMsg }}</h1>
    <router-link to="/"><button class="errButton">{{ $t('monitorView.back') }}</button></router-link>
  </div>
  <div v-if="!error" class="container">
    <div class="pageHeader">
      <h1 class="heading">
        <router-link to="/">{{ station }}</router-link>
      </h1>
      <div class="headerIcons">
        <font-awesome-icon class="headerIcon settingsIcon" icon="gear" size="lg" @click="showSettings = !showSettings" />
      </div>
    </div>
    <div class="settingsModal" :class="{ show: showModal }" v-if="showSettings">
      <form action="#">
        <div class="settingsHeader">
          <h2>{{ $t('monitorView.settings') }}</h2>
          <font-awesome-icon class="exit" icon="xmark" size="lg" @click="closeSettings" />
        </div>
        <div class="settings-option">
          <label>
            {{ $t('monitorView.showTrainNumbers') }}
            <input type="checkbox" v-model="showLineNumbers" />
          </label>
        </div>
        <div class="settings-option">
          <label>
            {{ $t('monitorView.sortBy') }}
            <select class="selectOption" v-model="sortBy">
              <option value="departure">{{ $t('monitorView.departureTime') }}</option>
              <option value="arrival">{{ $t('monitorView.arrivalTime') }}</option>
            </select>
            <select class="selectOption" v-model="sortOption">
              <option value="when">
                {{ $t('monitorView.current') }}
                {{
                  sortBy == 'departure'
                  ? $t('monitorView.departureTime')
                  : $t('monitorView.arrivalTime')
                }}
              </option>
              <option value="plannedWhen">
                {{ $t('monitorView.planned') }}
                {{
                  sortBy == 'departure'
                  ? $t('monitorView.departureTime')
                  : $t('monitorView.arrivalTime')
                }}
              </option>
            </select>
          </label>
        </div>
        <div class="settings-option">
          <label>{{ $t('monitorView.refreshRate') }}
            <input class="refreshRate" type="number" v-model="refreshRate" min="5" max="30" />
          </label>
        </div>
        <div class="settings-option">
          <label>{{ $t('monitorView.language') }}
            <select class="selectOption" v-model="language">
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select></label>
        </div>
        <div class="footer">
          <p>
            {{ $t('monitorView.currentVersion') }}:
            <a class="link" href="https://github.com/crwntec/db-live-monitor">{{ version }}</a>
          </p>
          <p>
            {{ $t('monitorView.lastDataUpdate') }}: {{ lastUpdate.toLocaleTimeString('de-DE') }}
          </p>
          <button type="submit" class="save" @click="closeSettings">
            {{ $t('monitorView.applySettings') }}
          </button>
        </div>
      </form>
    </div>
    <div id="scrollArea" class="stopsContainer">
      <ul id="contentArea" class="stops">
        <div v-if="loading" >
          <div class="stopRow" :key="n" v-for="n in 50"  >
            <content-loader  width="90vw" height="100" :speed="3" primaryColor="#bebebe" secondaryColor="#ecebeb">
              <rect x="100" y="50" rx="5" ry="5" width="35vw" height="14" />
              <rect x="10" y="40" rx="5" ry="5" width="55" height="35" />
              <rect x="70vw" y="50" rx="5" ry="5" width="15vw" height="14" />
            </content-loader>
          </div>
        </div>
        <li v-else v-for="(item, index) in stops" :key="index" @click="openDetails(item)">
          <div :class="{ stopRow: true, cancelled: item.cancelled, hasLeft: item.hasLeft }">
            <div :style="{animationDelay: index/20+'s'}" :class="['contentWrapper', {displayStop: !loading}]">
              <div class="lineContainer">
                <span class="line" :style="{ backgroundColor: getColor(item.line.productName) }">{{ item.line.name }}
                  <span v-if="showLineNumbers &&
                    !item.line.productName.includes('IC') &&
                    item.line.productName.slice(0, 2) !== 'EC'
                    " class="trainNumber">{{ item.line.fahrtNr }}</span>
                </span>
              </div>
              <span class="direction">
                {{ item.hasDeparture ? item.to : $t("monitorView.from") + item.from }}
              </span>
              <div class="info">
                <span v-if="item.hasNewTime" class="originalTime">{{
                  convertIRISTime(item.plannedWhen.split('|'), item, false)
                }}</span>
                <span class="when" :style="{ color: getTimeColor(item) }">
                  {{ convertIRISTime(item.when.split('|'), item, false) }}
                  ({{
                    calculateDelay(item.plannedWhen.split('|'), item.when.split('|'), item) >= 0
                    ? '+' + calculateDelay(item.plannedWhen.split('|'), item.when.split('|'), item)
                    : calculateDelay(item.plannedWhen.split('|'), item.when.split('|'), item)
                  }})
                </span>
              </div>
              <div class="platform">
                <span v-if="item.hasNewPlatform"
                  :style="{ 'text-decoration': item.hasNewPlatform ? 'line-through' : '' }">{{ item.plannedPlatform
                  }}</span>
                <span :style="{ color: item.hasNewPlatform ? 'red' : 'white' }">{{
                  ' ' + item.platform
                }}</span>
              </div>
              <div class="messages">
                <span class="delayCause">{{ getDelayMessage(item.causesOfDelay).join('++') }}</span>
              </div>
              {{ item.cancelled ? 'Fahrt fällt aus!' : '' }}
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import type * as Departures from '../types/departures-types'
import '../assets/monitor.css'
import '../assets/main.css'
import '../assets/loading.css'
import * as DateUtil from '../util/date'
import * as ColorUtil from '../util/colors'
import pjson from '../../package.json'
import PullToRefresh from 'pulltorefreshjs'
import { ContentLoader } from 'vue-content-loader'

export default defineComponent({
  name: 'Monitor-View',
  components: { ContentLoader },
  created: function () {
    PullToRefresh.init({
      mainElement: 'body',
      onRefresh() {
        window.location.reload()
      }
    })

    let ibnr = this.$route.params.station
    sessionStorage.setItem('scopedStationIBNR', ibnr || '')
    sessionStorage.setItem('scopedItem', '')
    const station = this.$route.query.i || this.$route.path.replace('/', '')
    if (this.$route.query.i) this.station = station
    this.connection = new WebSocket(
      `${import.meta.env.DEV
        ? 'ws://127.0.0.1:8080'
        : import.meta.env.VITE_BACKENDURI.replace(/https:\/{2}/g, 'wss://')
      }/wss?station=${ibnr}&refreshRate=${this.refreshRate * 1000}`
    )

    this.connection.onmessage = (event: MessageEvent) => {
      this.loading = false
      this.closeSettings()
      if (event.data == 404) {
        this.error = true
        this.errorMsg =
          this.$route.query.i == ''
            ? 'Bitte Bahnhof eingeben'
            : `Für ${station} liegen keine Daten vor `
      } else {
        this.lastUpdate = new Date(Date.now())
        let data: Departures.Timetable = JSON.parse(event.data)
        let departures: Departures.Stop[] = data.stops

        this.station = data.station
        sessionStorage.setItem('scopedStation', data.station)
        this.stops = departures.sort((a, b) => this.sortStops(a, b))
        sessionStorage.setItem('scopedStops', JSON.stringify(this.stops))
      }
    }
  },
  data() {
    return {
      connection: {} as WebSocket,
      loading: true,
      stops: [] as Departures.Stop[],
      station: '',
      error: false,
      errorMsg: '',
      refreshRate: Number(localStorage.getItem('refreshRate')) || 15,
      showModal: false,
      modalData: null as unknown,
      trainOrder: null,
      showSettings: false,
      showLineNumbers: localStorage.getItem('showLineNumbers') === 'true' || false,
      sortOption: localStorage.getItem('sortOption') || 'when',
      sortBy: localStorage.getItem('sortBy') || 'departure',
      language: localStorage.getItem('language') || 'de',
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
      sessionStorage.setItem('scopedItem', JSON.stringify(item))
      this.$router.push({
        name: 'details'
      })
    },
    closeSettings() {
      this.showSettings = false
      this.stops = this.stops.sort((a, b) => this.sortStops(a, b))
      localStorage.setItem('showLineNumbers', this.showLineNumbers.toString())
      localStorage.setItem('sortBy', this.sortBy)
      localStorage.setItem('sortOption', this.sortOption)
      localStorage.setItem('refreshRate', this.refreshRate.toString())
      localStorage.setItem('language', this.language)
      this.$i18n.locale = this.language
    },
    sortStops(a: Departures.Stop, b: Departures.Stop) {
      if (this.sortOption == 'when') {
        if (this.sortBy == 'departure') {
          return (
            parseInt(a.hasDeparture ? a.when.split('|')[1] : a.when.split('|')[0]) -
            parseInt(b.hasDeparture ? b.when.split('|')[1] : b.when.split('|')[0])
          )
        }
        return (
          parseInt(a.hasArrival ? a.when.split('|')[0] : a.when.split('|')[1]) -
          parseInt(b.hasDeparture ? b.when.split('|')[0] : b.when.split('|')[1])
        )
      }
      if (this.sortBy == 'departure') {
        return (
          parseInt(a.hasDeparture ? a.plannedWhen.split('|')[1] : a.plannedWhen.split('|')[0]) -
          parseInt(b.hasDeparture ? b.plannedWhen.split('|')[1] : b.plannedWhen.split('|')[0])
        )
      }
      return (
        parseInt(a.hasArrival ? a.plannedWhen.split('|')[0] : a.plannedWhen.split('|')[1]) -
        parseInt(b.hasDeparture ? b.plannedWhen.split('|')[0] : b.plannedWhen.split('|')[1])
      )
    }
  },
  unmounted() {
    this.connection.close()
  }
})
</script>
<style></style>
