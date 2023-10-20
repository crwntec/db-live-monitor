import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueVirtualScroller from 'vue-virtual-scroller'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faGear } from '@fortawesome/free-solid-svg-icons'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faGear)
library.add(faXmark)

createApp(App)
  .use(router)
  .use(VueVirtualScroller)
  .component('font-awesome-icon', FontAwesomeIcon)
  .mount('#app')
