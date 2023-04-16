<template>
    <div>
        <h1 v-if="error">{{ errorMsg }}</h1>
    </div>
    <div v-if="!error">
        <h1>{{ stop }}</h1>
        <li :key="item.tripId" v-for="item in departures">{{ item.line.name }} nach {{ item.destination.name }} um {{ new Date(item.plannedWhen).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) }}(+{{ item.delay ? item.delay/ 60 : 0 }})</li>
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
            departures: [] as Departures.Departure[],
            stop: '',
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
                let data = JSON.parse(event.data)
                let departures: Departures.Departure[] = data.departures;
                //console.log(departures);
                
                this.stop = departures[0].stop.name
                this.departures = departures
            }
            
            
        }
        
    },
    unmounted: function () {
        this.connection.close()
    }
})

</script>
<style>
    
</style>