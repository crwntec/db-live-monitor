<!-- eslint-disable no-undef -->
<script lang="ts">
import "../assets/home.css"
import "../assets/main.css"
import axios from "axios"
import pjson from "../../package.json"

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
            version: pjson.version,
            apiBase: import.meta.env.DEV ? 'http://127.0.0.1:8080' : import.meta.env.VITE_BACKENDURI,
        }
    },
    methods: {
        async getStops(inputStr: string) {
            this.loading = true
            if (inputStr == '' || inputStr.length <= 2) {
                this.suggestions = []
            } else {
                const res = await axios.get(`${this.apiBase}/search/${inputStr}`)
                this.showSuggestions = true
                this.suggestions = res.data
                this.loading = false
            }
        },
        async openStation() {
            if (this.input) {
                let parsed = encodeURIComponent(this.input)
                if (!this.hasSelected) {
                    const res = await axios.get(`${this.apiBase}/verify/${parsed}`)
                    if (res.data !== undefined) {
                        this.$router.push('/' + res.data.EVA_NR + '?i=' + res.data.NAME)
                    }
                } else {
                    this.$router.push('/' + parseInt(this.currentSuggestion.extId) + '?i=' + this.input)
                }
            }
        },
        handleEnterKey(event: KeyboardEvent) {
            if (event.key === 'Enter') {
                this.openStation();
            }
        },
        
    },
    watch: {
        input(newInput) {
            this.abortController.abort()
            if (!this.showSuggestions && this.input.length == 0 && !this.currentSuggestion) {
                this.showSuggestions = true
                console.log("fired")
            }
            if (this.input.length == 0) this.suggestions = []
            this.getStops(encodeURIComponent(newInput))
        }
    },
}
</script>

<template>
    <div class="homeContainer">
        <h1 class="title">DB-Live Monitor</h1>
        <div class="input">
            <input class="stationInput" v-model="input" :placeholder="$t('homeView.placeholder')" @keydown="handleEnterKey">
            <div class="suggestionsContainer">
                <div v-if="loading" class="suggestionsLoading">
                    <div class="spinner noMargin"></div>
                </div>
                <div v-if="showSuggestions && !loading && currentSuggestion == undefined" class="suggestions">
                    <div class="suggestion" @click="() => {
                        input = decodeURIComponent(suggestion.value)
                        showSuggestions = false,
                            currentSuggestion = suggestion,
                            hasSelected = true
                    }" v-bind:key="suggestion.extId" v-for="suggestion in suggestions">
                        {{ decodeURIComponent(suggestion.value) }}
                    </div>
                </div>
            </div>
            <button @click="openStation" role="link" class="stationSubmit">{{ $t("homeView.search") }}</button>
        </div>
    </div>
    <footer class="homeFooter">
        {{ $t("monitorView.currentVersion") }}: <a class="link" href="https://github.com/crwntec/db-live-monitor">{{ version
        }}</a>
    </footer>
</template>