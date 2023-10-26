<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type * as Departures from '../types/departures-types';

import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer, LGeoJson, LPolyline } from "@vue-leaflet/vue-leaflet";

import "../assets/modal.css"
import "../assets/main.css"

export default defineComponent({
  name: 'Train-Detail-Modal',
  components: {
    LMap,
    LTileLayer,
    LGeoJson,
    LPolyline
  },
  props: {
    data: Object as PropType<Departures.Stop> | undefined,
    station: String,
    trainOrder: Object as PropType<Departures.TrainOrder>,
    showModal: Boolean,
  },
  data() {
    return {
      openRemarks: [] as string[],
      hafasData: null as Departures.HafasData | null,
      loading: false,
      showMap: false,
      zoom: 10,
      center: [51, 70]
    };
  },
  methods: {
    loadTrain: function () {
      const trip = this.$parent.getTripById(this.data?.wing.wing);
      if (trip) {
        this.$emit('updateModalData', trip);
      }
    },
    fetchData: async function () {
      try {
        this.loading = true;
        const response = await fetch(
          `${import.meta.env.DEV ? 'http://127.0.0.1:8080' : import.meta.env.VITE_BACKENDURI}/details/${this.data.line.fahrtNr}?isBus=${this.data.line.productName.includes("Bus")}&line=${this.data.line.name}&isDeparture=${this.data.hasDeparture}`
        );
        if (response.status === 200) {
          const data = await response.json();
          this.hafasData = data as Departures.HafasData; // Replace with the correct type
          let coords = this.hafasData.stops[this.hafasData.stops.length / 2 | 0].geometry.coordinates
          this.center = [coords[1], coords[0]]
        }
        this.loading = false;
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    },
    toggleRemark: function (remarkId: string) {
      if (this.openRemarks.includes(remarkId)) {
        const index = this.openRemarks.indexOf(remarkId);
        this.openRemarks.splice(index, 1);
      } else {
        this.openRemarks.push(remarkId);
      }
    },
    getTime: function (stops: Departures.HafasData[] | null, currentStop: string): string {
      if (stops) {
        const stop = stops.find((o) => o.stop.name === currentStop);
        if (stop) {
          const dateString = stop?.departure || stop.plannedDeparture || stop?.arrival || '';
          const date = new Date(dateString);
          return `${date.getHours().toLocaleString('de', { minimumIntegerDigits: 2 })}:${date.getMinutes().toLocaleString('de', { minimumIntegerDigits: 2 })}`;
        } else {
          return 'Unbekannte Zeit:'
        }
      } else {
        return '';
      }
    },
    convertLoadFactor(loadFactor: string) {
      switch (loadFactor) {
        case "low":
          return "Niedrig"
        case "high":
          return "Hoch"
        case "very-high":
          return "Sehr hoch"
        case "full":
          return "Zug ausgebucht"
        default:
          break;
      }
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
        layer.bindTooltip("<div>" + feature.properties.name + "</div>")
      }
    }
  },
  watch: {
    showModal: {
      immediate: true,
      handler(newValue: boolean) {
        if (newValue) {
          this.fetchData();
        } else {
          this.hafasData = null;
          this.loading = false;
        }
      },
    },
  },
});
</script>
<template>
  <div v-if="data" class="modal-overlay" @click="$emit('close-modal')">
    <div class="modal" @click.stop>
      <div class="header">
        <h1 class="modalTitle"><span class="line"
            :style="{ backgroundColor: $parent?.getColor(data.line.productName) }">{{ data.line.name }}
          </span>{{
            data.line.fahrtNr }}</h1>
        <h2 class="fromTo"> {{ typeof data.from == 'string' ? data.from : data.from.stop }} -> {{ data.to }}</h2>
        <h2 v-if="data.cancelled" class="cancelledTrain">🚫Fahrt fällt aus</h2>
      </div>
      <div class="genInfo">
        <div class="arr">
          <span v-if="data.hasArrival">Ankunft: <span :style="{ 'color': $parent.getTimeColor(data) }">{{
            $parent?.convertIRISTime(data.when.split('|'),
              data, true) }}</span></span>
          <span v-if="data.hasNewArr && data.hasArrival">Geplant: {{
            $parent?.convertIRISTime(data.plannedWhen.split('|'), data, true) }}</span>
        </div>
        <div class="plat">
          Gleis <span v-if="data.hasNewPlatform"
            :style="{ 'text-decoration': data.hasNewPlatform ? 'line-through' : '' }">{{ data.plannedPlatform
            }}</span>
          <span :style="{ 'color': data.hasNewPlatform ? 'red' : 'white' }">{{ " " + data.platform }}</span>
        </div>
        <div class="dep">
          <span v-if="data.hasDeparture">Abfahrt: <span :style="{ 'color': $parent.getTimeColor(data) }">
              {{ $parent?.convertIRISTime(data.when.split('|'), data, false) }} </span></span>
          <span v-if="data.hasNewTime && data.hasDeparture">Geplant: {{
            $parent?.convertIRISTime(data.plannedWhen.split('|'), data, false) }}</span>
        </div>
      </div>
      <div class="" v-if="data.onlyPlanData"><span>📝 Derzeit sind für diese Fahrt nur Plandaten bekannt</span></div>
      <div class="" v-if="!hafasData && !loading"><span>🔍 Derzeit sind für diese Fahrt keine HAFAS-Daten
          bekannt</span></div>
      <span class="loading" v-if="loading">
        <div class="loader"></div>Lade Daten
      </span>
      <div v-if="hafasData && !loading">
        <span v-if="hafasData.loadFactor" class="occupancyContainer">Auslastung:
          <svg v-if="hafasData.loadFactor == 'low'" class="occupancy" viewBox="0 0 33 32" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <text></text>
            <ellipse cx="16.5" cy="16" rx="16.5" ry="16" fill="#62E46F" />
            <line x1="7.32925" y1="17.6237" x2="15.3293" y2="24.6237" stroke="black" />
            <line x1="14.6" y1="24.7" x2="26.6" y2="8.7" stroke="black" />
          </svg>
          <svg v-if="hafasData.loadFactor == 'high'" class="occupancy" viewBox="0 0 33 32" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="16.5" cy="16" rx="16.5" ry="16" fill="#D4E13C" />
            <path d="M17 6L7.5 24H26L17 6Z" fill="black" stroke="black" />
            <circle cx="16.5" cy="20.5" r="1.5" fill="#D4E13C" />
            <path d="M18 18H15.5L15 10H18.5L18 18Z" fill="#D4E13C" stroke="black" />
          </svg>
          <svg v-if="hafasData.loadFactor == 'very-high'" class="occupancy" viewBox="0 0 33 32" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="16.5" cy="16" rx="16.5" ry="16" fill="#D9A215" />
            <circle cx="16.5" cy="15.5" r="9.5" stroke="black" stroke-width="2" />
            <circle cx="16.5" cy="20.5" r="1.5" fill="black" />
            <path d="M17.5714 17H15.4286L15 10H18L17.5714 17Z" fill="black" />
          </svg>
          <svg v-if="hafasData.loadFactor == 'full'" class="occupancy" viewBox="0 0 33 32" fill="none"
            xmlns="http://www.w3.org/2000/svg">
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
          <li :key="msg.id" v-for="msg in data.causesOfDelay"><span v-if="msg.timestamp"> ⚠️{{
            $parent?.convertTimestamp(msg.timestamp, false) }}: {{ msg.text }}</span></li>
          <li :key="qMsg.id" v-for="qMsg in data.qualityChanges"><span v-if="qMsg.timestamp">⚠️{{
            $parent?.convertTimestamp(qMsg.timestamp, false) }}: {{ qMsg.text }}</span></li>
        </ul>
      </div>
      <div v-if="data.hasWings && $parent?.getTripById(data.wing.wing)" class="wings">
        <span>Fährt von {{ data.wing.start.station }} bis {{ data.wing.end.station }} vereint mit <a class="trainLink"
            @click="loadTrain"> {{ $parent?.getTripById(data.wing.wing).line.name + "(" +
              $parent?.getTripById(data.wing.wing).line.fahrtNr + ")" }}</a></span>
      </div>
      <div class="trip">
        <h4>🚉 Fahrtverlauf:</h4>
        <ul>
          <li class="previousStop" :key="stop" v-for="stop in data.arrivalPath"><span v-if="hafasData">
              {{ getTime(hafasData.stopovers, stop) }}
            </span> {{ stop }}</li>
          <li class="currentStop">{{ (data.hasDeparture ? $parent?.convertIRISTime(data.when.split('|'), data,
            false) : $parent?.convertIRISTime(data.when.split('|'), data, true)) + " " + station }}</li>
          <li class="followingStop" :key="stop" v-for="stop in data.currentPath"><span v-if="hafasData">
              {{ getTime(hafasData.stopovers, stop) }}
            </span> {{ stop }}</li>
        </ul>
      </div>
      <div class="mapContainer">
        <h4 @click="showMap = !showMap">
          🗺️<i :class="['arrow-icon', { 'arrow-right': !showMap }]">▼</i>{{ !showMap ? "Karte anzeigen" : "Karte verstecken" }}
        </h4>
        <div v-if="showMap" class="map">
          <l-map ref="map" :use-global-leaflet="false" v-model:zoom="zoom" :center="center">
            <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" layer-type="base"
              name="OpenStreetMap"></l-tile-layer>
            <l-polyline v-if="hafasData" :lat-lngs="hafasData.polyline" color="#c55959"></l-polyline>
            <l-geo-json v-if="hafasData" :geojson="hafasData.stops" :options="options" :options-style="styleMap" />
          </l-map>
        </div>
      </div>
      <div class="hints" v-if="hafasData">
        <ul>
          <li :key="hint.id" v-for="hint in hafasData.hints">💡{{ hint.text }}</li>
        </ul>
      </div>
      <div class="additionalDetails" v-if="trainOrder">
        <div class="trainOrder">
          <div
            :class="[{ 'coach': coach.kategorie !== 'Lok', 'powercarContainerTop': coach.isPowercar, 'controlCar': coach.isControlcar, 'middleCar': coach.kategorie.includes('wagen') && !coach.isControlcar, 'flipped': index == 0 }]"
            :key="coach.id" v-for="(coach, index) in trainOrder.firstTrain">
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
              <svg class="locomotive" viewBox="0 0 340 121" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M69.8969 21.9901H300.535C309.077 21.9901 316.848 26.9354 320.465 34.6744L326.322 47.2054C328.775 52.4526 330.611 57.9662 331.795 63.6361L338.129 93.9777C338.704 96.733 338.745 99.578 338.25 102.349V102.349C336.375 112.84 327.246 120.5 316.589 120.5H22.6206C12.3182 120.5 3.39564 113.351 1.14971 103.296L1.04987 102.849C0.358146 99.7524 0.344461 96.5427 1.00975 93.4402L7.98822 60.8974L15.1894 37.5148C18.0314 28.2865 26.5588 21.9901 36.2148 21.9901H69.8969ZM69.8969 21.9901L128.989 15.0599C129.28 15.0257 129.5 14.779 129.5 14.4858V14.4858C129.5 14.2049 129.298 13.9647 129.021 13.9164L78 5M78 5H63M78 5V0V9.5M269.5 21.9901L227.165 20.3345L269.5 18.5M63 0V9.5M269.5 18.5V15.5M269.5 18.5V21M269.5 18.5H274M274 18.5V15.5M274 18.5V21"
                  stroke="white" stroke-width="2" />
                <text class="locoDetails" x="50%" y="60%" text-anchor="middle" fill="white">{{ coach.kategorie }}</text>
                <text class="locoDetails" x="50%" y="80%" text-anchor="middle" fill="white">BR {{ coach.baureihe }}</text>
              </svg>
              <span class="section">{{ coach.abschnitt }}</span>
            </div>
            <div class="powercarContainer" v-if="coach.isPowercar">
              <svg :class="['powercar', { 'flippedPowercar': index != 0 }]" viewBox="0 0 320 121" fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M18.2325 25.5H224.762C276.532 25.5 318.5 67.468 318.5 119.238C318.5 121.04 317.04 122.5 315.238 122.5H5.23255C3.29955 122.5 1.73254 120.933 1.73254 119V42C1.73254 32.8873 9.11985 25.5 18.2325 25.5Z"
                  stroke="white" stroke-width="2" />
                <path
                  d="M59.1403 25L116 18.8679L59.1403 8.01887M59.1403 8.01887H37.0001V0V15.0943M59.1403 8.01887V0V15.0943"
                  stroke="white" stroke-width="3" />
                <text class="locoDetails" x="50%" y="60%" text-anchor="middle" fill="white">{{ coach.kategorie }}</text>
              </svg>
            </div>
            <span v-if="!coach.isLocomotive" class="section">{{ coach.abschnitt }}</span>
          </div>
          <div
            :class="[{ 'coach': coach.kategorie !== 'Lok', 'powercarContainerTop': coach.isPowercar, 'controlCar': coach.isControlcar, 'middleCar': coach.kategorie.includes('wagen') && !coach.isControlcar, 'flipped': index == 0 }]"
            :key="coach.id" v-for="(coach, index) in trainOrder.secondTrain">
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
              <svg class="locomotive" viewBox="0 0 340 121" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M69.8969 21.9901H300.535C309.077 21.9901 316.848 26.9354 320.465 34.6744L326.322 47.2054C328.775 52.4526 330.611 57.9662 331.795 63.6361L338.129 93.9777C338.704 96.733 338.745 99.578 338.25 102.349V102.349C336.375 112.84 327.246 120.5 316.589 120.5H22.6206C12.3182 120.5 3.39564 113.351 1.14971 103.296L1.04987 102.849C0.358146 99.7524 0.344461 96.5427 1.00975 93.4402L7.98822 60.8974L15.1894 37.5148C18.0314 28.2865 26.5588 21.9901 36.2148 21.9901H69.8969ZM69.8969 21.9901L128.989 15.0599C129.28 15.0257 129.5 14.779 129.5 14.4858V14.4858C129.5 14.2049 129.298 13.9647 129.021 13.9164L78 5M78 5H63M78 5V0V9.5M269.5 21.9901L227.165 20.3345L269.5 18.5M63 0V9.5M269.5 18.5V15.5M269.5 18.5V21M269.5 18.5H274M274 18.5V15.5M274 18.5V21"
                  stroke="white" stroke-width="2" />
                <text class="locoDetails" x="50%" y="60%" text-anchor="middle" fill="white">{{ coach.kategorie }}</text>
                <text class="locoDetails" x="50%" y="80%" text-anchor="middle" fill="white">{{ coach.baureihe }}</text>
              </svg>
              <span class="section">{{ coach.abschnitt }}</span>
          </div>
          <div class="powercarContainer" v-if="coach.isPowercar">
            <svg :class="['powercar', { 'flippedPowercar': index != 0 }]" viewBox="0 0 320 121" fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M18.2325 25.5H224.762C276.532 25.5 318.5 67.468 318.5 119.238C318.5 121.04 317.04 122.5 315.238 122.5H5.23255C3.29955 122.5 1.73254 120.933 1.73254 119V42C1.73254 32.8873 9.11985 25.5 18.2325 25.5Z"
                stroke="white" stroke-width="2" />
              <path
                d="M59.1403 25L116 18.8679L59.1403 8.01887M59.1403 8.01887H37.0001V0V15.0943M59.1403 8.01887V0V15.0943"
                stroke="white" stroke-width="3" />
              <text class="locoDetails" x="50%" y="60%" text-anchor="middle" fill="white">{{ coach.kategorie }}</text>
            </svg>
          </div>
          <span v-if="!coach.isLocomotive" class="section">{{ coach.abschnitt }}</span>
        </div>
      </div>
      <div class="br"> ------------ <div class="brContainer"><span>Baureihe {{ trainOrder.baureihe }}</span><span> ( Tz
            {{trainOrder.trainId}} )</span></div> ------------></div>
    </div>
  </div>
</div></template>
