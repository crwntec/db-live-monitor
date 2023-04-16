import { createRouter, createWebHistory } from 'vue-router'
import depsList from "./components/deps-list.vue";

export default createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/:station',
        component: depsList,
      }
    ]
  })