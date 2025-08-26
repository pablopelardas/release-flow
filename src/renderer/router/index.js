import { createRouter, createWebHashHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import Dashboard from '../views/Dashboard.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: Dashboard,
      },
      {
        path: '/repositories',
        name: 'Repositories',
        component: () => import('../views/Repositories.vue'),
      },
      {
        path: '/templates',
        name: 'Templates',
        component: () => import('../views/Templates.vue'),
      },
      {
        path: '/releases',
        name: 'Releases',
        component: () => import('../views/Releases.vue'),
      },
      {
        path: '/settings',
        name: 'Settings',
        component: () => import('../views/Settings.vue'),
      },
      {
        path: '/activity',
        name: 'Activity',
        component: () => import('../views/Activity.vue'),
      },
      {
        path: '/changelog',
        name: 'Changelog',
        component: () => import('../views/Changelog.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
