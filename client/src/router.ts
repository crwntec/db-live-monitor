import { createRouter, createWebHistory } from 'vue-router'
import Monitor from "./views/monitor-view.vue"
import Home from "./views/home-view.vue"
import Details from './views/detail-view.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/:station',
      component: Monitor
    },
    {
      path: '/',
      component: Home
    },
    {
      path: '/details',
      name: 'details',
      props: true,
      component: Details
    }
  ]
})
