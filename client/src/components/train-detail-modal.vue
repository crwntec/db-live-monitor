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
            <div class="" v-if="data.hafasRef == undefined"><span>🔍 Derzeit sind für diese Fahrt keine HAFAS-Daten
                    bekannt</span></div>
            <div class="messages">
                <ul>
                    <li :key="remark.id" v-for="remark in data.remarks">
                        <span>🔧{{ remark.text }}</span>
                    </li>
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
                    <li class="previousStop" :key="stop" v-for="stop in data.arrivalPath">{{ (stop.arTime || stop.dpTime
                        ? (stop.dpTime == "00:00" ? (stop.arTime == "00:00" ? (stop.plArTime == "00:00" ? stop.plDpTime :
                            stop.plArTime) : stop.dpTime) + " " :
                            stop.dpTime + " ") : "") +
                        stop.stop }}</li>
                    <li class="currentStop">{{ (data.hasDeparture ? $parent?.convertIRISTime(data.when.split('|'), data,
                        false) : $parent?.convertIRISTime(data.when.split('|'), data, true)) + " " + station }}</li>
                    <li class="followingStop" :key="stop" v-for="stop in data.currentPath">{{ (stop.arTime || stop.dpTime
                        ? (stop.dpTime == "00:00" ? (stop.arTime == "00:00" ? (stop.plArTime == "00:00" ? stop.plDpTime :
                            stop.plArTime) : stop.arTime) + " " :
                            stop.dpTime + " ") : "") +
                        stop.stop}}</li>
                </ul>
            </div>
            <div class="hints">
                <ul>
                    <li :key="hint.id" v-for="hint in data.hints">{{ hint }}</li>
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
import type { PropType } from 'vue';
import type * as Departures from '../departures-types';
import { defineComponent } from 'vue'
import "../assets/modal.css"

export default defineComponent({
    props: {
        data: Object as PropType<Departures.Stop> | undefined,
        station: String,
        trainOrder: Object as PropType<Departures.TrainOrder>
    },
    methods: {
        loadTrain() {
            const trip = this.$parent.getTripById(this.data.wing.wing);
            if (trip) {
                this.$emit('updateModalData', trip); // Update the data object with the new trip
            }
        },
    },
})
</script>
<style lang="css"></style>