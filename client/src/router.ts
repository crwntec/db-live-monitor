import { createRouter, createWebHistory } from 'vue-router'
import Monitor from "./views/monitor-view.vue"
import Home from "./views/home-view.vue"
import Trip from "./views/trip-view.vue"

export default createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/:station',
        component: Monitor,
      },
      {
        path: '/',
        component: Home
      },
      {
        path: '/trip/:tripId',
        component: Trip
      }
    ]
  })