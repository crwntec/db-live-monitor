<template >
    <div class="tripView" v-if="hafasData">
        <div class="header">
            <div v-if="hafasData.line" class="line lineLg" :style="{ backgroundColor: getColor(hafasData.line.productName) }">{{ hafasData.line.name }}</div>
            <div v-if="hafasData.origin && hafasData.destination" class="direction"><h2>{{ hafasData.origin.name }} 🡒 {{ hafasData.destination.name }}</h2></div>
        </div>
        <div class="stops">
            <div class="nextStop">
                <h3>{{ hafasData.stopovers ? (hafasData.stopovers.findIndex(el => el == nextStop) == 0 ? "Abfahrt" :
                    "Nächster Halt: " +
                    nextStop.stop.name) : "" }} um {{ new Date(nextStop.arrival || nextStop.departure ||
        nextStop.plannedArrival
        || nextStop.plannedDeparture).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) }}</h3>
            </div>
            <li class="stopover" :key="stop.stop.id" v-for="stop in hafasData.stopovers">
                <div class="time">
                    <span class="arr">
                        {{ new Date(stop.arrival || stop.departure || stop.plannedArrival
                            || stop.plannedDeparture).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) }}
                    </span>
                    <span class="dep">
                        {{ new Date(stop.departure || stop.arrival || stop.plannedDeparture ||
                            stop.plannedArrival).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) }}
                    </span>
                </div>
                <svg class="stopDot" xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25"
                    fill="none">
                    <circle cx="12.5" cy="12.5" r="12" :fill="isPassedStop(stop, false) ? '#FF5959' : 'white'"
                        stroke="#1C1B22" />
                    <circle cx="12.5" cy="12.5" r="8" :fill="isPassedStop(stop, false) ? '#FF5959' : 'white'"
                        stroke="#1C1B22" stroke-width="3" />
                </svg>
                <span class="stopName">{{ stop.stop.name }}</span>
                <div class="overlapLine base" v-if="stop.stop.name !== lastStop.stop.name" />
                <div v-if="stop.stop.name !== lastStop.stop.name" :class="['overlapLine', isPassedStop(stop, false) ? 'passed' : '']"
                    :style="{ height: getHeight(stop, !isPassedStop(stop, true)) + '%', borderRadius: isPassedStop(stop, true) ? '0' : '0 0 10px 10px' }" />
            </li>
        </div>
    </div>
</template>
<script lang="ts">
import type { HafasData, Stop, Stopover } from '@/types/departures-types';
import "../assets/main.css"
import "../assets/trip.css"
import { getColor } from '../util/getColor';
export default {
    name: 'Trip-View',
    data() {
        return {
            connection: {} as WebSocket,
            apiBase: import.meta.env.DEV ? 'http://127.0.0.1:8080' : import.meta.env.VITE_BACKENDURI,
            hafasData: {} as HafasData,
            now: Date.now(),
            nextStop: {} as Stopover,
            lastStop: {} as Stopover
        }
    },
    created: async function () {
        this.connection = new WebSocket(`${import.meta.env.DEV ? 'ws://127.0.0.1:8080' : import.meta.env.VITE_BACKENDURI.replace(/https:\/{2}/g, 'wss://')}/trip?trip=${this.$route.params.tripId}`)
        this.connection.onmessage = (event: MessageEvent) => {
            // console.log("fired")
            const res = JSON.parse(event.data)
            this.hafasData = res.trip
            this.nextStop = this.getNextStop()
            this.lastStop = this.hafasData.stopovers[this.hafasData.stopovers.length - 1]
        }

    },
    methods: {
        getNextStop(): Stopover {
            const now = Date.now();

            if (this.hafasData.stopovers && this.hafasData.stopovers.length > 0) {
                for (let stop of this.hafasData.stopovers) {
                    const departureTime = Date.parse(stop.departure || stop.arrival || stop.plannedDeparture || stop.plannedArrival);
                    if (departureTime > now) {
                        return stop;
                    }
                }
            }

            return {} as Stopover;
        },
        isPassedStop(stop: Stopover, isLine: boolean): boolean {
            if (this.hafasData.stopovers) {
                const nextStop = this.getNextStop()
                const nextStopInd = this.hafasData.stopovers.findIndex(el => el.stop.name == nextStop.stop.name)
                if (isLine) {
                    return this.hafasData.stopovers.findIndex(el => el.stop.name == stop.stop.name) < nextStopInd - 1
                }
                return this.hafasData.stopovers.findIndex(el => el.stop.name == stop.stop.name) < nextStopInd
            }
            return false

        },
        getHeight(currStop: Stopover, inProg: boolean): number {
            if (this.hafasData.stopovers) {
                const nextStop = this.getNextStop()
                const lastStop = currStop
                const nextStopTimeString = nextStop.arrival || nextStop.departure || nextStop.plannedArrival || nextStop.plannedDeparture;
                const stopTimeString = lastStop.arrival || lastStop.departure || lastStop.plannedArrival || lastStop.plannedDeparture;
                if (nextStopTimeString && stopTimeString) {
                    const nextStopTime = Date.parse(nextStopTimeString);
                    const stopTime = Date.parse(stopTimeString);

                    if (!isNaN(nextStopTime) && !isNaN(stopTime)) {
                        const timeDiff = nextStopTime - stopTime;
                        const timePassed = Date.now() - stopTime;
                        if (inProg) {
                            return (timePassed / timeDiff) * 100 + 100;
                        }
                        return (timePassed / timeDiff) * 100 + 160
                    } else {
                        return 0
                    }
                } else {
                    return 0
                }
            }
            console.log("err")
            return 0
        },
        getColor(_: string) { return getColor(_) },
    }
}
</script>