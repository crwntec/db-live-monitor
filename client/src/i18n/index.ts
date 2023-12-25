import { createI18n } from 'vue-i18n'

export default createI18n({
  locale: import.meta.env.VITE_DEFAULT_LOCALE,
  fallbackLocale: import.meta.env.VITE_FALLBACK_LOCALE,
  globalInjection: true,
  legacy: false,
  messages: {
    en: {
      detailView: {
        nextStp: 'Next stop',
        at: 'at',
        runs: 'Runs',
        from: 'From',
        to: 'To',
        togetherWith: 'together with',
        loadingData: 'Loading data',
        cancelledTrain: '🚫Train is cancelled',
        planData: '📝Only plan data is available for this train',
        noHafasData: '📡No Hafas data available',
        occupancy: 'Occupancy',
        stopovers: '🚉 Stopovers',
        showMap: 'Show map',
        hideMap: 'Hide map',
        baureihe: 'Series'
      },
      homeView: {
        placeholder: 'Search station',
        search: 'Search'
      },
      monitorView: {
        back: 'Back',
        from: 'From',
        settings: 'Settings',
        showTrainNumbers: 'Show train numbers',
        sortBy: 'Sort by',
        arrivalTime: 'Arrival time',
        departureTime: 'Departure time',
        current: 'Current',
        planned: 'Planned',
        language: 'Language',
        refreshRate: 'Refresh rate in seconds',
        currentVersion: 'Current version',
        lastDataUpdate: 'Last data update',
        applySettings: 'Apply settings',
        cancelled: 'Train is cancelled'
      }
    },
    de: {
      detailView: {
        nextStop: 'Nächster Halt',
        at: 'um',
        runs: 'Fährt',
        from: 'Von',
        to: 'bis',
        togetherWith: 'vereint mit',
        loadingData: 'Lade Daten',
        cancelledTrain: '🚫Fahrt fällt aus',
        planData: '📝 Derzeit sind für diese Fahrt nur Plandaten bekannt',
        noHafasData: '📡 Keine Hafas-Daten verfügbar',
        occupancy: 'Auslsastung',
        stopovers: '🚉 Fahrtverlauf',
        showMap: 'Karte anzeigen',
        hideMap: 'Karte verbergen',
        baureihe: 'Baureihe'
      },
      homeView: {
        placeholder: 'Bahnhof suchen',
        search: 'Suchen'
      },
      monitorView: {
        back: 'Zurück',
        from: 'Von',
        settings: 'Einstellungen',
        showTrainNumbers: 'Zugnummern anzeigen',
        sortBy: 'Sortieren nach',
        arrivalTime: 'Ankunftszeit',
        departureTime: 'Abfahrtszeit',
        current: 'Aktueller',
        planned: 'Geplanter',
        language: 'Sprache',
        refreshRate: 'Aktualisierungsrate in Sekunden',
        currentVersion: 'Aktuelle Version',
        lastDataUpdate: 'Letztes Datenupdate',
        applySettings: 'Einstellungen übernehmen',
        cancelled: 'Fahrt fällt aus'
      }
    }
  }
})
