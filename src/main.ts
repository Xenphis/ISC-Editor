import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Tooltip from 'primevue/tooltip'
import Aura from '@primeuix/themes/aura'
import { definePreset } from '@primeuix/themes'
import 'primeicons/primeicons.css'
import '@/style.css'
import App from '@/App.vue'
import i18n from '@/i18n'
import router from '@/router'

const TrinityPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{cyan.50}',
      100: '{cyan.100}',
      200: '{cyan.200}',
      300: '{cyan.300}',
      400: '{cyan.400}',
      500: '{cyan.500}',
      600: '{cyan.600}',
      700: '{cyan.700}',
      800: '{cyan.800}',
      900: '{cyan.900}',
      950: '{cyan.950}'
    },
    colorScheme: {
      dark: {
        // Align PrimeVue dark surfaces (drawers, dialogs, overlays) with the
        // app's slate-blue design instead of the default zinc.
        surface: {
          0: '#ffffff',
          50: '{slate.50}',
          100: '{slate.100}',
          200: '{slate.200}',
          300: '{slate.300}',
          400: '{slate.400}',
          500: '{slate.500}',
          600: '{slate.600}',
          700: '{slate.700}',
          800: '{slate.800}',
          900: '{slate.900}',
          950: '{slate.950}'
        }
      }
    }
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(PrimeVue, {
  theme: {
    preset: TrinityPreset,
    options: {
      // Must be a class selector matched by <html class="dark"> (index.html).
      // A bare element selector like 'html' is treated as a "custom" rule by
      // @primeuix and generates `html { :root { ... } }`, which never matches:
      // dark tokens silently stay off and every overlay renders light.
      darkModeSelector: '.dark',
      cssLayer: false
    }
  }
})
app.directive('tooltip', Tooltip)

app.mount('#app')
