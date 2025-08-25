import { createRouter, createWebHashHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/repositories',
    name: 'Repositories',
    component: () => import('../views/Repositories.vue')
  },
  {
    path: '/templates',
    name: 'Templates', 
    component: () => import('../views/Templates.vue')
  },
  {
    path: '/releases',
    name: 'Releases',
    component: () => import('../views/Releases.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router