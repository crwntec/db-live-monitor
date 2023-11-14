<!-- eslint-disable no-undef -->
<script lang="ts">
import "../assets/home.css"
import "../assets/main.css"
import axios from "axios"
interface Suggestion {
    extId: string,
    value: string
}
export default {
    name: "Home-View",
    data() {
        return {
            input: '',
            suggestions: [] as Suggestion[],
            showSuggestions: true,
            currentSuggestion: {} as Suggestion,
            hasSelected: false,
            abortController: new AbortController(),
            apiBase: import.meta.env.DEV ? 'http://127.0.0.1:8080': import.meta.env.VITE_BACKENDURI
        }
    },
    watch: {
        input(newInput) {
            this.abortController.abort()
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
                const res = await axios.get(`${this.apiBase}/search/${inputStr}`)
                this.suggestions = res.data
            }
        },
        async openStation(){
            if (this.input) {
                if (!this.hasSelected) {
                    const res = await axios.get(`${this.apiBase}/verify/${this.input}`)
                    if (res.data==true) {
                        this.$router.push('/' + this.input)
                    }
                } else {
                    this.$router.push('/' + parseInt(this.currentSuggestion.extId)+'?i='+this.input)
                }
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