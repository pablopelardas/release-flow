import { createPinia } from 'pinia'
import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import './style.css' // TailwindCSS primero
import 'primeicons/primeicons.css'
import 'primevue/resources/themes/aura-light-green/theme.css'
import 'primevue/resources/primevue.min.css'
import App from './App.vue'
import router from './router'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: 'Aura',
    options: {
      darkModeSelector: '.dark',
    },
  },
})
app.mount('#app')
