<!-- eslint-disable no-undef -->
<script lang="ts">
import "../assets/home.css"
import "../assets/main.css"
interface Suggestion {
    extId: string,
    value: string
}
export default {
    name: "Home-Component",
    data() {
        return {
            input: '',
            suggestions: [] as Suggestion[],
            showSuggestions: true,
            currentSuggestion: {} as Suggestion,
            hasSelected: false
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
        },
        openStation(){
            if(this.input){
                this.$router.push('/' + parseInt(this.currentSuggestion.extId)+'?i='+this.input)
            }
        }
    }
}
</script>

<template>
    <div class="homeContainer">
        <h1 class="title">DB-Live Monitor</h1>
        <div class="input">
            <input class="stationInput" v-model="input" placeholder="Bahnhof suchen">
            <div v-if="suggestions.length > 0 && showSuggestions" class="suggestions">
                <div
                class="suggestion" 
                @click="()=>{
                    input = decodeURIComponent(suggestion.value)
                    showSuggestions = false,
                    currentSuggestion = suggestion,
                    hasSelected = true
                }"
                v-bind:key="suggestion.extId" 
                v-for="suggestion in suggestions">
                    {{decodeURIComponent(suggestion.value)}}
                </div>
            </div>
            <button @click="openStation" role="link" class="stationSubmit">Suchen</button>
            <!-- <router-link :to="{path: '/' + parseInt(this.currentSuggestion.extId), query: {i:this.input}}" custom v-slot="{ navigate }"></router-link> -->
        </div>
    </div>
</template>

<style>
</style>