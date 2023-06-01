import { createRouter, createWebHistory } from 'vue-router'
import depsList from "./components/deps-list.vue";
import Home from "./components/home-component.vue"

export default createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/:station',
        component: depsList,
      },
      {
        path: '/',
        component: Home
      }
    ]
  })