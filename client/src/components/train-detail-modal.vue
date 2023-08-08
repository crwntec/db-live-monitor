<template>
    <div v-if="data" class="modal-overlay" @click="$emit('close-modal')">
        <div class="modal" @click.stop>
            <div class="header">
                <h1 class="modalTitle"><span class="line" :style="{backgroundColor: $parent?.getColor(data.line.productName)} ">{{ data.line.name }} </span>{{ data.line.fahrtNr }}</h1>
                <h2 class="fromTo"> {{ data.from }} -> {{ data.to }}</h2>
            </div>
            <div class="genInfo">
                <div class="arr">
                    <span v-if="data.hasArrival">Ankunft: <span :style="{'color':data.hasNewTime ? 'red' : 'white'}">{{$parent?.convertIRISTime(data.when.split('|'), data,true) }}</span></span>
                    <span v-if="data.hasNewArr && data.hasArrival">Geplant: {{ $parent?.convertIRISTime(data.plannedWhen.split('|'), data,true) }}</span>
                </div>
                <div class="plat">
                    Gleis <span v-if="data.hasNewPlatform" :style="{'text-decoration': data.hasNewPlatform ? 'line-through' : ''}">{{ data.plannedPlatform }}</span>
                    <span :style="{'color': data.hasNewPlatform ? 'red' : 'white'}">{{ " " + data.platform }}</span>
                </div>
                <div class="dep">
                    <span v-if="data.hasDeparture">Abfahrt: <span :style="{ 'color': data.hasNewTime ? 'red' : 'white' }"> {{  $parent?.convertIRISTime(data.when.split('|'), data, false)   }} </span></span>
                    <span v-if="data.hasNewTime && data.hasDeparture">Geplant: {{ $parent?.convertIRISTime(data.plannedWhen.split('|'), data, false) }}</span>
                </div>
            </div>
            <div class="himMessages">
                <ul>
                    <li :key="himMsg.id" v-for="himMsg in data.himMessages">
                        <span v-if="himMsg.from">🔧 Vom {{ $parent?.convertTimestamp(himMsg.from,true) }} bis zum {{ $parent?.convertTimestamp(himMsg.to,true) }} kommt es auf der Linie {{ data.line.name }} zu Änderungen (Halteausfälle, Verspätungen, etc...). Grund dafür sind/ist (eine) {{ himMsg.cat }}</span>
                    </li>
                    <li :key="msg.id" v-for="msg in data.causesOfDelay"><span v-if="msg.timestamp"> {{ $parent?.convertTimestamp(msg.timestamp, false) }}: {{ msg.text }}</span></li>
                    <li :key="qMsg.id" v-for="qMsg in data.qualityChanges"><span v-if="qMsg.timestamp">{{ $parent?.convertTimestamp(qMsg.timestamp, false) }}: {{ qMsg.text }}</span></li>
                </ul>
            </div>
            <div class="trip">
                Fahrtverlauf:
                <ul>
                    <li class="previousStop" :key="stop" v-for="stop in data.arrivalPath">{{ stop }}</li>
                    <li class="currentStop">{{ station }}</li>
                    <li class="followingStop" :key="stop" v-for="stop in data.plannedPath">{{ stop }}</li>
                </ul>
            </div>
            <div class="additionalDetails" v-if="trainOrder">
                {{ trainOrder }}
                <div class="trainOrder">
                    <div class="coach" :key="coach.id" v-for="coach in trainOrder.firstTrain">
                        <div class="coachDetails">
                            <div>
                                {{ coach.id }}
                            </div>
                            <div v-if="coach.kategorie !=='Lok' ">
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
  }
})
</script>
<style lang="css">
    
</style>