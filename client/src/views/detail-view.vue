<script lang="ts">
import { defineComponent } from 'vue'
import type * as Departures from '../types/departures-types'

import 'leaflet/dist/leaflet.css'
import { LMap, LTileLayer, LGeoJson, LPolyline } from '@vue-leaflet/vue-leaflet'

import axios from 'axios'

import '../assets/detail.css'
import '../assets/main.css'
import '../assets/trip.css'

import * as DateUtil from '../util/date'
import * as ColorUtil from '../util/colors'

export default defineComponent({
  name: 'Detail-View',
  components: {
    LMap,
    LTileLayer,
    LGeoJson,
    LPolyline
  },
  data() {
    return {
      station: localStorage.getItem('scopedStation'),
      data: JSON.parse(localStorage.getItem('scopedItem') || '{}'),
      trainOrder: {} as Departures.TrainOrder,
      openRemarks: [] as string[],
      hafasData: null as Departures.HafasData | null,
      loading: false,
      showMap: false,
      zoom: 10,
      center: [51, 70],
      nextStop: {} as Departures.Stopover,
      lastStop: {} as Departures.Stopover,
      stops: JSON.parse(localStorage.getItem('scopedStops') || "{}")
    }
  },
  methods: {
    convertIRISTime: DateUtil.convertIRISTime,
    convertDateToIRIS: DateUtil.convertDateToIRIS,
    convertTimestamp: DateUtil.convertTimestamp,
    calculateDelay: DateUtil.calculateDelay,
    getColor: ColorUtil.getColor,
    getTimeColor: ColorUtil.getTimeColor,
    getDelayMessage: ColorUtil.getDelayMessage,
    getTripById: ColorUtil.getTripById,
    routeLoaded() {
      this.fetchData()
    },
    loadTrain: function () {
      const trip = this.getTripById(this.stops,this.data?.wing.wing)
      if (trip) {
        localStorage.setItem('scopedItem', JSON.stringify(trip))
        this.$router.go(0)
      }
    },
    fetchData: async function () {
      try {
        this.loading = true
        const response = await axios.get(
          `${
            import.meta.env.DEV ? 'http://127.0.0.1:8080' : import.meta.env.VITE_BACKENDURI
          }/details/${this.data.line.fahrtNr}?isBus=${this.data.line.productName.includes(
            'Bus'
          )}&line=${this.data.line.name}&ibnr=${localStorage.getItem('scopedStationIBNR')}&isDeparture=${this.data.hasDeparture}&language=${sessionStorage.getItem("language")}`
        )
        if (response.status === 200) {
          const data = response.data
          this.hafasData = data as Departures.HafasData
          this.nextStop = this.getNextStop()
          this.lastStop = this.hafasData.stopovers[this.hafasData.stopovers.length - 1]
          let coords =
          this.hafasData.stops[(this.hafasData.stops.length / 2) | 0].geometry.coordinates
          this.center = [coords[1], coords[0]]
          if (this.hafasData !== null) {
            axios
              .get(
                `${import.meta.env.DEV ? 'http://127.0.0.1:8080' : import.meta.env.VITE_BACKENDURI}/wr/${this.hafasData.line.fahrtNr}/${this.convertDateToIRIS(this.hafasData.plannedDeparture)}?type=${this.hafasData.line.productName}`
              )
              .then((res) => {
                if (res.status !== 204) {
                  this.trainOrder = res.data
                } else {
                  this.trainOrder = null as any
                }
              })
          }
        }
        this.loading = false
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    },
    toggleRemark: function (remarkId: string) {
      if (this.openRemarks.includes(remarkId)) {
        const index = this.openRemarks.indexOf(remarkId)
        this.openRemarks.splice(index, 1)
      } else {
        this.openRemarks.push(remarkId)
      }
    },
    getTime: function (stops: Departures.Stopover[] | null, currentStop: string): string {
      if (stops) {
        const stop = stops.find((o) => o.stop.name === currentStop)
        if (stop) {
          const dateString = stop?.departure || stop.plannedDeparture || stop?.arrival || ''
          const date = new Date(dateString)
          return `${date.getHours().toLocaleString('de', { minimumIntegerDigits: 2 })}:${date
            .getMinutes()
            .toLocaleString('de', { minimumIntegerDigits: 2 })}`
        } else {
          return 'Unbekannte Zeit:'
        }
      } else {
        return ''
      }
    },
    convertLoadFactor(loadFactor: string) {
      const language = sessionStorage.getItem('language')
      if (language=="de") {
        switch (loadFactor) {
          case 'low':
            return 'Niedrig'
          case 'low-to-medium':
            return 'Niedrig bis mittel'
          case 'high':
            return 'Hoch'
          case 'very-high':
            return 'Sehr hoch'
          case 'exceptionally-high':
            return 'Außergewöhnlich hoch'
          case 'full':
            return 'Zug ausgebucht'
          default:
            break
        }
      } else {
        switch (loadFactor) {
          case 'low':
            return 'Low'
          case 'low-to-medium':
            return 'Low to medium'
          case 'high':
            return 'High'
          case 'very-high':
            return 'Very high'
          case 'exceptionally-high':
            return 'Exceptionally high'
          case 'full':
            return 'Train full'
          default:
            break
        }
      }
    },
    getNextStop(): Departures.Stopover {
      const now = Date.now()

      if (this.hafasData !== null && this.hafasData.stopovers && this.hafasData.stopovers.length > 0) {
        for (let stop of this.hafasData.stopovers) {
          const departureTime = Date.parse(
            stop.departure || stop.arrival || stop.plannedDeparture || stop.plannedArrival
          )
          if (departureTime > now) {
            return stop
          }
        }
      }

      return undefined as any
    },
    isPassedStop(stop: Departures.Stopover, isLine: boolean): boolean {
      if (this.hafasData !== null && this.hafasData.stopovers) {
        const nextStop = this.getNextStop()
        if (nextStop) {
          const nextStopInd = this.hafasData.stopovers.findIndex(
            (el) => el.stop.name == nextStop.stop.name
          )
          if (isLine) {
            return (
              this.hafasData.stopovers.findIndex((el) => el.stop.name == stop.stop.name) <
              nextStopInd - 1
            )
          }
          return (
            this.hafasData.stopovers.findIndex((el) => el.stop.name == stop.stop.name) < nextStopInd
          )
        }
      }
      return false
    },
    getHeight(currStop: Departures.Stopover, inProg: boolean): number {
      if (this.hafasData !== null && this.hafasData.stopovers) {
        const nextStop = this.getNextStop()
        if (nextStop) {
          const lastStop = currStop
          const nextStopTimeString =
            nextStop.arrival ||
            nextStop.departure ||
            nextStop.plannedArrival ||
            nextStop.plannedDeparture
          const stopTimeString =
            lastStop.arrival ||
            lastStop.departure ||
            lastStop.plannedArrival ||
            lastStop.plannedDeparture
          const nextStopTime = Date.parse(nextStopTimeString)
          const stopTime = Date.parse(stopTimeString)

          if (!isNaN(nextStopTime) && !isNaN(stopTime)) {
            const timeDiff = nextStopTime - stopTime
            const timePassed = Date.now() - stopTime
            if (inProg) {
              return (timePassed / timeDiff) * 100 + 100
            }
            return (timePassed / timeDiff) * 100 + 360
          } else {
            return 0
          }
        } else {
          return 0
        }
      }
      console.log('err')
      return 0
    }
  },
  computed: {
    options() {
      return {
        onEachFeature: this.onEachFeature
      }
    },
    styleMap() {
      return () => {
        return {
          weight: 1
        }
      }
    },
    onEachFeature() {
      return (feature, layer) => {
        layer.bindTooltip('<div>' + feature.properties.name + '</div>')
      }
    }
  },
  mounted() {
    this.fetchData()
  }
})
</script>
<template>
  <span class="loading" v-if="loading">
    <div class="loader"></div>
    {{$t('detailView.loadingData')}}
  </span>
  <div class="wrapper" v-if="!loading">
    <div class="header">
      <h1 class="modalTitle">
        <span class="line" :style="{ backgroundColor: getColor(data.line.productName) }"
          >{{ data.line.name }} </span
        >{{ data.line.fahrtNr }}
      </h1>
      <h2 class="fromTo">
        {{ typeof data.from == 'string' ? data.from : data.from.stop }} ➡️ {{ data.to }}
      </h2>
      <h4 class="operator" v-if="!loading && hafasData">{{ hafasData.line.operator.name }}</h4>
      <h2 v-if="data.cancelled" class="cancelledTrain">{{$t("detailView.cancelledTrain")}}</h2>
    </div>
    <div class="detailsContainer">
      <div class="genInfo">
        <span class="nextStop">{{ $t('detailView.nextStop') }}: <b>{{ nextStop?.stop?.name || "" }}</b> {{  $t("detailView.at") }} <span class="nextStopTime" :style="{backgroundColor: getTimeColor(nextStop?.arrivalDelay / 60 || nextStop?.departureDelay / 60)}">{{ getTime(hafasData?.stopovers as Departures.Stopover[] | null, nextStop?.stop?.name) }}</span>({{ (nextStop?.departureDelay || nextStop?.arrivalDelay || 0) < 0 ? "-" : "+" + (nextStop?.departureDelay || nextStop?.arrivalDelay || 0) / 60 }})</span>
      </div>
      <div class="" v-if="data.onlyPlanData">
        <span>{{$t('detailView.planData')}}</span>
      </div>
      <div class="" v-if="!hafasData && !loading">
        <span>{{$t('detailView.noHafasData')}}</span>
      </div>

      <div v-if="hafasData && !loading">
        <span v-if="hafasData.loadFactor" class="occupancyContainer"
          >{{$t('detailView.occupancy')}}
          <svg
            v-if="hafasData.loadFactor == 'low' || hafasData.loadFactor == 'low-to-medium'"
            class="occupancy"
            viewBox="0 0 33 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse cx="16.5" cy="16" rx="16.5" ry="16" fill="#62E46F" />
            <line x1="7.32925" y1="17.6237" x2="15.3293" y2="24.6237" stroke="black" />
            <line x1="14.6" y1="24.7" x2="26.6" y2="8.7" stroke="black" />
          </svg>
          <svg
            v-if="hafasData.loadFactor == 'high'"
            class="occupancy"
            viewBox="0 0 33 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse cx="16.5" cy="16" rx="16.5" ry="16" fill="#D4E13C" />
            <path d="M17 6L7.5 24H26L17 6Z" fill="black" stroke="black" />
            <circle cx="16.5" cy="20.5" r="1.5" fill="#D4E13C" />
            <path d="M18 18H15.5L15 10H18.5L18 18Z" fill="#D4E13C" stroke="black" />
          </svg>
          <svg
            v-if="hafasData.loadFactor == 'very-high' || hafasData.loadFactor == 'exceptionally-high'"
            class="occupancy"
            viewBox="0 0 33 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse cx="16.5" cy="16" rx="16.5" ry="16" fill="#D9A215" />
            <circle cx="16.5" cy="15.5" r="9.5" stroke="black" stroke-width="2" />
            <circle cx="16.5" cy="20.5" r="1.5" fill="black" />
            <path d="M17.5714 17H15.4286L15 10H18L17.5714 17Z" fill="black" />
          </svg>
          <svg
            v-if="hafasData.loadFactor == 'full' "
            class="occupancy"
            viewBox="0 0 33 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse cx="16.5" cy="16" rx="16.5" ry="16" fill="#E1463C" />
            <line x1="6.33448" y1="6.62835" x2="26.3345" y2="24.6284" stroke="black" />
            <line x1="24.3641" y1="7.34268" x2="8.3641" y2="24.3427" stroke="black" />
          </svg>
          {{ convertLoadFactor(hafasData.loadFactor) }}
        </span>
      </div>
      <div class="messages">
        <ul>
          <div v-if="hafasData">
            <li :key="remark.id" v-for="remark in hafasData.remarks">
              <span @click="toggleRemark(remark.id)">
                <i :class="['arrow-icon', { 'arrow-down': openRemarks.includes(remark.id) }]">▼</i>
                🔧{{ remark.summary }}
              </span>
              <div v-if="openRemarks.includes(remark.id)">
                {{ remark.text }}
              </div>
            </li>
          </div>
          <li :key="msg.id" v-for="msg in data.causesOfDelay">
            <span v-if="msg.timestamp">
              ⚠️{{ convertTimestamp(msg.timestamp, false) }}: {{ msg.text }}</span
            >
          </li>
          <li :key="qMsg.id" v-for="qMsg in data.qualityChanges">
            <span v-if="qMsg.timestamp"
              >⚠️{{ convertTimestamp(qMsg.timestamp, false) }}: {{ qMsg.text }}</span
            >
          </li>
        </ul>
      </div>
      <div v-if="data.hasWings && getTripById(stops, data.wing.wing)" class="wings">
                <span>{{ $t("detailView.runs") + " " + $t("detailView.from")  + " " +data.wing.start.station + " " + $t("detailView.to") + " " + data.wing.end.station + " " +$t("detailView.togetherWith") }} <a class="trainLink"
                        @click="loadTrain"> {{ getTripById(stops, data.wing.wing)?.line?.name + "(" +
                            getTripById(stops, data.wing.wing)?.line?.fahrtNr + ")" }}</a></span>
            </div>
      <div v-if="hafasData" class="trip">
        <h4>{{$t("detailView.stopovers")}}</h4>
        <li  class="stopover" :key="stop.stop.id" v-for="stop in hafasData.stopovers">
          <div class="time">
            <span class="planned">
              {{
                new Date(
                  stop.plannedDeparture || stop.plannedArrival
                ).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
              }}
            </span>
            <span class="current" :style="{ backgroundColor: getTimeColor((stop.departureDelay || stop.arrivalDelay)/60 || null) }">
              {{
                new Date(
                  stop.departure || stop.arrival || stop.plannedDeparture || stop.plannedArrival
                ).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
              }} 
            </span>
          </div>
          <svg
            class="stopDot"
            xmlns="http://www.w3.org/2000/svg"
            width="25"
            height="25"
            viewBox="0 0 25 25"
            fill="none"
          >
            <circle
              cx="12.5"
              cy="12.5"
              r="12"
              :fill="isPassedStop(stop, false) ? '#FF5959' : 'white'"
              stroke="#1C1B22"
            />
            <circle
              cx="12.5"
              cy="12.5"
              r="8"
              :fill="isPassedStop(stop, false) ? '#FF5959' : 'white'"
              stroke="#1C1B22"
              stroke-width="3"
            />
          </svg>
          <span class="stopName">{{ stop.stop.name }}</span>
          <div class="overlapLine base" v-if="stop.stop.name !== lastStop.stop.name" />
          <div
            v-if="stop.stop.name !== lastStop.stop.name"
            :class="['overlapLine', isPassedStop(stop, false) ? 'passed' : '']"
            :style="{
              height: getHeight(stop, !isPassedStop(stop, true)) + '%',
              borderRadius: isPassedStop(stop, true) ? '0' : '0 0 10px 10px'
            }"
          />
        </li>
      </div>
      <div class="mapContainer">
        <h4 @click="showMap = !showMap">
          🗺️<i :class="['arrow-icon', { 'arrow-right': !showMap }]">▼</i
          >{{ !showMap ? $t("detailView.showMap") : $t("detailView.hideMap") }}
        </h4>
        <div v-if="showMap" class="map">
          <l-map ref="map" :use-global-leaflet="false" v-model:zoom="zoom" :center="center">
            <l-tile-layer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              layer-type="base"
              name="OpenStreetMap"
            ></l-tile-layer>
            <l-polyline
              v-if="hafasData"
              :lat-lngs="hafasData.polyline"
              color="#c55959"
            ></l-polyline>
            <l-geo-json
              v-if="hafasData"
              :geojson="hafasData.stops"
              :options="options"
              :options-style="styleMap"
            />
          </l-map>
        </div>
      </div>
      <div class="hints" v-if="hafasData">
        <ul>
          <li :key="hint.id" v-for="hint in hafasData.hints">💡{{ hint.text }}</li>
        </ul>
      </div>
      <div class="additionalDetails" v-if="trainOrder !== null">
        <div class="trainOrder">
          <div
            :class="[
              {
                coach: coach.kategorie !== 'Lok',
                powercarContainerTop: coach.isPowercar,
                controlCar: coach.isControlcar,
                middleCar: coach.kategorie.includes('wagen') && !coach.isControlcar,
                flipped: index == 0
              }
            ]"
            :key="coach.id"
            v-for="(coach, index) in trainOrder.firstTrain"
          >
            <div v-if="!coach.isLocomotive && !coach.isPowercar" class="coachDetails">
              <div>
                {{ coach.id }}
              </div>
              <div v-if="coach.kategorie !== 'Lok'">
                {{ coach.class }}
              </div>
              <div v-if="coach.kategorie == 'Lok'">
                {{ coach.baureihe }}
              </div>
              <div>
                {{ coach.kategorie }}
              </div>
            </div>
            <div class="locoContainer" v-if="coach.isLocomotive">
              <svg
                class="locomotive"
                viewBox="0 0 340 121"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M69.8969 21.9901H300.535C309.077 21.9901 316.848 26.9354 320.465 34.6744L326.322 47.2054C328.775 52.4526 330.611 57.9662 331.795 63.6361L338.129 93.9777C338.704 96.733 338.745 99.578 338.25 102.349V102.349C336.375 112.84 327.246 120.5 316.589 120.5H22.6206C12.3182 120.5 3.39564 113.351 1.14971 103.296L1.04987 102.849C0.358146 99.7524 0.344461 96.5427 1.00975 93.4402L7.98822 60.8974L15.1894 37.5148C18.0314 28.2865 26.5588 21.9901 36.2148 21.9901H69.8969ZM69.8969 21.9901L128.989 15.0599C129.28 15.0257 129.5 14.779 129.5 14.4858V14.4858C129.5 14.2049 129.298 13.9647 129.021 13.9164L78 5M78 5H63M78 5V0V9.5M269.5 21.9901L227.165 20.3345L269.5 18.5M63 0V9.5M269.5 18.5V15.5M269.5 18.5V21M269.5 18.5H274M274 18.5V15.5M274 18.5V21"
                  stroke="white"
                  stroke-width="2"
                />
                <text class="locoDetails" x="50%" y="60%" text-anchor="middle" fill="white">
                  {{ coach.kategorie }}
                </text>
                <text class="locoDetails" x="50%" y="80%" text-anchor="middle" fill="white">
                  BR {{ coach.baureihe }}
                </text>
              </svg>
              <span class="section">{{ coach.abschnitt }}</span>
            </div>
            <div class="powercarContainer" v-if="coach.isPowercar">
              <svg
                :class="['powercar', { flippedPowercar: index != 0 }]"
                viewBox="0 0 320 121"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18.2325 25.5H224.762C276.532 25.5 318.5 67.468 318.5 119.238C318.5 121.04 317.04 122.5 315.238 122.5H5.23255C3.29955 122.5 1.73254 120.933 1.73254 119V42C1.73254 32.8873 9.11985 25.5 18.2325 25.5Z"
                  stroke="white"
                  stroke-width="2"
                />
                <path
                  d="M59.1403 25L116 18.8679L59.1403 8.01887M59.1403 8.01887H37.0001V0V15.0943M59.1403 8.01887V0V15.0943"
                  stroke="white"
                  stroke-width="3"
                />
                <text class="locoDetails" x="50%" y="60%" text-anchor="middle" fill="white">
                  {{ coach.kategorie }}
                </text>
              </svg>
            </div>
            <span v-if="!coach.isLocomotive" class="section">{{ coach.abschnitt }}</span>
          </div>
          <div
            :class="[
              {
                coach: coach.kategorie !== 'Lok',
                powercarContainerTop: coach.isPowercar,
                controlCar: coach.isControlcar,
                middleCar: coach.kategorie.includes('wagen') && !coach.isControlcar,
                flipped: index == 0
              }
            ]"
            :key="coach.id"
            v-for="(coach, index) in trainOrder.secondTrain"
          >
            <div v-if="!coach.isLocomotive && !coach.isPowercar" class="coachDetails">
              <div>
                {{ coach.id }}
              </div>
              <div>
                {{ coach.typ }}
              </div>
              <div>
                {{ coach.kategorie }}
              </div>
            </div>
            <div class="locoContainer" v-if="coach.isLocomotive">
              <svg
                class="locomotive"
                viewBox="0 0 340 121"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M69.8969 21.9901H300.535C309.077 21.9901 316.848 26.9354 320.465 34.6744L326.322 47.2054C328.775 52.4526 330.611 57.9662 331.795 63.6361L338.129 93.9777C338.704 96.733 338.745 99.578 338.25 102.349V102.349C336.375 112.84 327.246 120.5 316.589 120.5H22.6206C12.3182 120.5 3.39564 113.351 1.14971 103.296L1.04987 102.849C0.358146 99.7524 0.344461 96.5427 1.00975 93.4402L7.98822 60.8974L15.1894 37.5148C18.0314 28.2865 26.5588 21.9901 36.2148 21.9901H69.8969ZM69.8969 21.9901L128.989 15.0599C129.28 15.0257 129.5 14.779 129.5 14.4858V14.4858C129.5 14.2049 129.298 13.9647 129.021 13.9164L78 5M78 5H63M78 5V0V9.5M269.5 21.9901L227.165 20.3345L269.5 18.5M63 0V9.5M269.5 18.5V15.5M269.5 18.5V21M269.5 18.5H274M274 18.5V15.5M274 18.5V21"
                  stroke="white"
                  stroke-width="2"
                />
                <text class="locoDetails" x="50%" y="60%" text-anchor="middle" fill="white">
                  {{ coach.kategorie }}
                </text>
                <text class="locoDetails" x="50%" y="80%" text-anchor="middle" fill="white">
                  {{ coach.baureihe }}
                </text>
              </svg>
              <span class="section">{{ coach.abschnitt }}</span>
            </div>
            <div class="powercarContainer" v-if="coach.isPowercar">
              <svg
                :class="['powercar', { flippedPowercar: index != 0 }]"
                viewBox="0 0 320 121"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18.2325 25.5H224.762C276.532 25.5 318.5 67.468 318.5 119.238C318.5 121.04 317.04 122.5 315.238 122.5H5.23255C3.29955 122.5 1.73254 120.933 1.73254 119V42C1.73254 32.8873 9.11985 25.5 18.2325 25.5Z"
                  stroke="white"
                  stroke-width="2"
                />
                <path
                  d="M59.1403 25L116 18.8679L59.1403 8.01887M59.1403 8.01887H37.0001V0V15.0943M59.1403 8.01887V0V15.0943"
                  stroke="white"
                  stroke-width="3"
                />
                <text class="locoDetails" x="50%" y="60%" text-anchor="middle" fill="white">
                  {{ coach.kategorie }}
                </text>
              </svg>
            </div>
            <span v-if="!coach.isLocomotive" class="section">{{ coach.abschnitt }}</span>
          </div>
        </div>
        <div class="br">
          ------------
          <div class="brContainer">
            <span>{{ $t("detailView.baureihe") }} {{ trainOrder.baureihe }}</span
            ><span>
              ( Fzg:
              {{ trainOrder.trainId }} )</span
            >
          </div>
          ---->
        </div>
      </div>
    </div>
  </div>
</template>
