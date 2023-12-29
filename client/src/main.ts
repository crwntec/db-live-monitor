import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faGear } from '@fortawesome/free-solid-svg-icons'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { faTrain } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import i18n from "./i18n"
import VueGtag from "vue-gtag";
import { v4 as uuidv4 } from 'uuid';

library.add(faGear)
library.add(faXmark)
library.add(faTrain)

function createNewID() {
  const uid = uuidv4();
  localStorage.setItem('uid', uid);
  return uid;
}

createApp(App)
  .use(router)
  .use(i18n)
  .use(VueGtag, {
    config: {
      id: import.meta.env.VITE_GA_ID,
      params: {
        user_id: localStorage.getItem('uid') || createNewID()
      }
    }
  },router)
  .component('font-awesome-icon', FontAwesomeIcon)
  .mount('#app')

