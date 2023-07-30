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
        </div>
    </div>
</template>
<script lang="ts">
import type { PropType } from 'vue';
import type * as Departures from '../departures-types';
import { defineComponent } from 'vue'

export default defineComponent({
  props: {
    data: Object as PropType<Departures.Stop>,
    station: String
  }
})
</script>
<style lang="css">
    .modal-overlay {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    background-color: #2c2c2cce;
    z-index: 10;
    }
    .modal {
        background-color: #121212;  
        height: 70vh;
        width: 50vw;
        margin-top: 10%;
        padding: 60px 0;
        border-radius: 20px;
        font-size: .6vw;
        padding: 1em;
        overflow-y: scroll;
    }
    .modal::-webkit-scrollbar {
        display: none;
    }
    .header {
        text-align: center;
        border-bottom: 2px solid grey;
        display: flex;
        align-items: center;
        flex-direction: column;
    }
    .genInfo {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        padding: 10px;
        font-size: 1rem;
    }
    .arr{
        display: flex;
        flex-direction: column;
        margin: auto;
    }
    .dep{
        display: flex;
        flex-direction: column;
        margin: auto;
    }
    .fromTo {
        text-align: center;
    }
    .previousStop {
        color: #cccccc;
    }
    .currentStop {
        font-weight: bold;
    }
    .plat {
        text-align: center;
    }

    @media only screen and (min-width: 300px) and (max-width: 800px) {
        .modal {
            font-size: 3.5vw;
            width: 80vw;
        }
        .arr {
            text-align: left;
        }
        .dep {
            text-align: right;
        }
    }
</style>