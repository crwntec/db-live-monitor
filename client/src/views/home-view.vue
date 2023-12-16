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
            loading: false,
            suggestions: [] as Suggestion[],
            showSuggestions: true,
            currentSuggestion: undefined as Suggestion | undefined,
            hasSelected: false,
            abortController: new AbortController(),
            apiBase: import.meta.env.DEV ? 'http://127.0.0.1:8080': import.meta.env.VITE_BACKENDURI
        }
    },
    watch: {
        input(newInput) {
            this.abortController.abort()
            if(!this.showSuggestions && this.input.length==0 && !this.currentSuggestion) {
                this.showSuggestions = true
                console.log("fired")
            }
            if(this.input.length==0) this.suggestions=[]
            this.getStops(encodeURIComponent(newInput))
        }
    },
    methods: {
        async getStops(inputStr: string) {
            this.loading = true
            if (inputStr=='' || inputStr.length <= 2) {
                this.suggestions = []
            } else {
                const res = await axios.get(`${this.apiBase}/search/${inputStr}`)
                this.showSuggestions = true
                this.suggestions = res.data
                this.loading = false
            }
        },
        async openStation(){
            if (this.input) {
                let parsed = encodeURIComponent(this.input)
                if (!this.hasSelected) {
                    const res = await axios.get(`${this.apiBase}/verify/${parsed}`)
                    if (res.data==true) {
                        this.$router.push('/' + this.input)
                    }
                } else {
                    this.$router.push('/' + parseInt(this.currentSuggestion.extId)+'?i='+this.input)
                }
            }
        },
        handleEnterKey(event: KeyboardEvent) {
            if (event.key === 'Enter') {
                this.openStation();
            }
        }
    }
}
</script>

<template>
    <div class="homeContainer">
        <h1 class="title">DB-Live Monitor</h1>
        <div class="input">
            <input class="stationInput" v-model="input" placeholder="Bahnhof suchen" @keydown="handleEnterKey">
            <div class="suggestionsContainer">
                <div v-if="loading" class="suggestionsLoading"><div class="spinner noMargin"></div></div>
                <div v-if="showSuggestions && !loading && currentSuggestion==undefined " class="suggestions">
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
            </div>
            <button @click="openStation" role="link" class="stationSubmit">Suchen</button>
        </div>
    </div>
</template>

<style>
</style>