<!-- eslint-disable no-undef -->
<script lang="ts">
import "../assets/home.css"
import "../assets/main.css"
export default {
    name: "Home-Component",
    data() {
        return {
            input: '',
            suggestions: [],
            showSuggestions: true,
            currentSuggestion: {}
        }
    },
    watch: {
        input(newInput) {
            if(this.input.length==0 && !this.showSuggestions) this.showSuggestions = true
            if(this.input.length==0) this.suggestions=[]
            this.getStops(newInput)
        }
    },
    methods: {
        async getStops(inputStr: string) {
            if (inputStr=='' || inputStr.length <= 2) {
               this.suggestions = []
            } else {
                const res = await fetch(`https://${import.meta.env.VITE_BACKENDURI}/search/${inputStr}`)
                this.suggestions = (await res.json())
            }
        }
    }
}
</script>

<template>
    <div class="homeContainer">
        <h1>DB-Live Monitor</h1>
        <div class="input">
            <input class="stationInput" v-model="input" placeholder="Bahnhof suchen">
            <div v-if="suggestions.length > 0 && showSuggestions" class="suggestions">
                <div
                class="suggestion" 
                @click="()=>{
                    input = decodeURIComponent(suggestion.value)
                    showSuggestions = false,
                    currentSuggestion = suggestion
                }"
                v-bind:key="suggestion.extId" 
                v-for="suggestion in this.suggestions">
                    {{decodeURIComponent(suggestion.value)}}
                </div>
            </div>
            <router-link :to="{path: '/' + parseInt(this.currentSuggestion.extId), query: {i:this.input}}" custom v-slot="{ navigate }"><button @click="navigate" role="link" class="stationSubmit">Suchen</button></router-link>
        </div>
    </div>
</template>

<style>
</style>