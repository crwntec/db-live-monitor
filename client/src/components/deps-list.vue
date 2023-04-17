<template>
    <div>
        <h1 v-if="error">{{ errorMsg }}</h1>
    </div>
    <div v-if="!error">
        <h1>{{ station }}</h1>
        <li :key="item.tripId" v-for="item in stops">{{ item.line.name }} nach {{ item.direction }} um {{ convertIRISTime(item.plannedWhen.split('|')[0])}}(+{{ calculateDelay(item.plannedWhen,item.when)}})</li>
    </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue';
import type * as Departures from '../departures-types';

export default defineComponent({
    name: 'Deps-List',
    data: function () {
        return {
            connection: {} as WebSocket,
            stops: [] as Departures.Stop[],
            station: '',
            error: false,
            errorMsg: ''
        };
    },
    created: function() {
        console.log('Connecting to socket...');
        let station = this.$route.params.station
        this.connection = new WebSocket(`ws://localhost:8080/${station}`)
        
        this.connection.onmessage = (event: MessageEvent) => {
            //console.log(event.data);
            if(event.data == 404){
                this.error = true
                this.errorMsg = `${station} is not a valid station`
            } else {
                let data: Departures.Timetable = JSON.parse(event.data)
                let departures: Departures.Stop[] = data.stops;
                //console.log(departures);
                
                this.station = data.station
                this.stops = departures
            }
            
            
        }
        
    },
    methods: {
        convertIRISTime(dateString: string) {
            const hour = Number(dateString.slice(6, 8));
            const minute = Number(dateString.slice(8, 10));
            return `${hour}:${minute}`
        },
        calculateDelay(plannedTime:string, currentTime:string){
            const delay = ((parseInt(currentTime)-parseInt(plannedTime)) / 100).toFixed(2)
            const hour = parseInt(delay.toString().split('.')[0])
            const minute = parseInt(delay.toString().split('.')[1])
            console.log(delay)

            return hour/60+minute
        }
    },
    unmounted: function () {
        this.connection.close()
    }
})

</script>
<style>
    
</style>