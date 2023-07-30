import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueVirtualScroller from 'vue-virtual-scroller'

createApp(App)
    .use(router)
    .use(VueVirtualScroller)
    .mount('#app')
