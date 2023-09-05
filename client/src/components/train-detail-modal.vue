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
                    <span v-if="data.hasArrival">Ankunft: <span :style="{ 'color': data.hasNewTime ? 'red' : 'white' }">{{
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
                    <span v-if="data.hasDeparture">Abfahrt: <span :style="{ 'color': data.hasNewTime ? 'red' : 'white' }">
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
                <span>Fährt von {{ data.wing.start.station }} bis {{ data.wing.end.station }} vereint mit <a
                        class="trainLink" @click="loadTrain"> {{ $parent?.getTripById(data.wing.wing).line.name + "(" +
                            $parent?.getTripById(data.wing.wing).line.fahrtNr + ")" }}</a></span>
            </div>
            <div class="trip">
                Fahrtverlauf:
                <ul>
                    <li class="previousStop" :key="stop" v-for="stop in data.arrivalPath"><span v-if="hafasData">
                            {{ getTime(hafasData.stopovers,stop) }}
                        </span> {{ stop }}</li>
                    <li class="currentStop">{{ (data.hasDeparture ? $parent?.convertIRISTime(data.when.split('|'), data,
                        false) : $parent?.convertIRISTime(data.when.split('|'), data, true)) + " " + station }}</li>
                    <li class="followingStop" :key="stop" v-for="stop in data.currentPath"><span v-if="hafasData">
                            {{ getTime(hafasData.stopovers,stop) }}
                        </span> {{ stop }}</li>
                </ul>
            </div>
            <div class="hints" v-if="hafasData">
                <ul>
                    <li :key="hint.id" v-for="hint in hafasData.hints">💡{{ hint.text }}</li>
                </ul>
            </div>
            <div class="additionalDetails" v-if="trainOrder">
                <div class="trainOrder">
                    <div class="coach" :key="coach.id" v-for="coach in trainOrder.firstTrain">
                        <div class="coachDetails">
                            <div>
                                {{ coach.id }}
                            </div>
                            <div v-if="coach.kategorie !== 'Lok'">
                                {{ coach.typ }}
                            </div>
                            <div v-if="coach.kategorie == 'Lok'">
                                {{ coach.baureihe }}
                            </div>
                            <div>
                                {{ coach.kategorie }}
                            </div>
                        </div>
                        <span class="section">{{ coach.abschnitt }}</span>
                    </div>
                    <div class="coach" :key="coach.id" v-for="coach in trainOrder.secondTrain">
                        <div class="coachDetails">
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
                        <span class="section">{{ coach.abschnitt }}</span>
                    </div>
                </div>
                <div class="br"> ------------ Baureihe {{ trainOrder.baureihe }} ------------></div>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type * as Departures from '../departures-types';
import "../assets/modal.css"

export default defineComponent({
  name: 'Train-Detail-Modal',
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
    };
  },
  methods: {
    loadTrain() {
      const trip = this.$parent.getTripById(this.data?.wing.wing);
      if (trip) {
        this.$emit('updateModalData', trip);
      }
    },
    async fetchData() {
      try {
        this.loading = true;
        const response = await fetch(
          `${import.meta.env.DEV ? 'http://127.0.0.1:8080' : import.meta.env.VITE_BACKENDURI}/details/${this.data.line.fahrtNr}?isBus=${this.data.line.productName.includes("Bus")}&line=${this.data.line.name}`
        );
        if (response.status === 200) {
          const data = await response.json();
          this.hafasData = data as Departures.HafasData; // Replace with the correct type
        }
        this.loading = false;
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    },
    toggleRemark(remarkId: string) {
      if (this.openRemarks.includes(remarkId)) {
        const index = this.openRemarks.indexOf(remarkId);
        this.openRemarks.splice(index, 1);
      } else {
        this.openRemarks.push(remarkId);
      }
    },
    getTime(stops: Departures.Stop[] | null, currentStop: string): string {
      if (stops) {
        const stop = stops.find((o) => o.stop.name === currentStop);
        const dateString = stop?.departure || stop.plannedDeparture || stop?.arrival || '';
        const date = new Date(dateString);
        return `${date.getHours().toLocaleString('de',{minimumIntegerDigits: 2})}:${date.getMinutes().toLocaleString('de', {minimumIntegerDigits: 2})}`;
      } else {
        return '';
      }
    },
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