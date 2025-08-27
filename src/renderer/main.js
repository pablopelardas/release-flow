import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Aura from '@primevue/themes/aura'

// CSS imports
import './style.css' // TailwindCSS primero
import 'primeicons/primeicons.css'

// App imports
import App from './App.vue'
import router from './router'

// Create app
const app = createApp(App)
const pinia = createPinia()

// Register plugins in correct order
// 1. First PrimeVue config - v4 configuration
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark',
      cssLayer: false
    }
  },
  ripple: true
})

// 2. Then ToastService MUST come after PrimeVue
app.use(ToastService)

// 3. Then Pinia and Router
app.use(pinia)
app.use(router)

// Mount app
app.mount('#app')
