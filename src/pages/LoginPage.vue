<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Button from 'primevue/button'
import { connectDb } from '@/services/database'
import { useConnectionStore } from '@/stores/connectionStore'
import SettingsDialog from '@/components/SettingsDialog.vue'

const { t, locale } = useI18n()
const router = useRouter()
const connection = useConnectionStore()
const settingsVisible = ref(false)

function toggleLocale() {
  locale.value = locale.value === 'fr' ? 'en' : 'fr'
}

const host = ref('')
const port = ref(3306)
const username = ref('')
const password = ref('')
const database = ref('world')
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  if (!host.value || !username.value || !password.value || !database.value) return

  loading.value = true
  error.value = ''

  try {
    await connectDb(host.value, port.value, username.value, password.value, database.value)
    connection.connect({
      host: host.value,
      port: port.value,
      username: username.value,
      database: database.value
    })
    router.push('/npc')
  } catch (e: any) {
    error.value = typeof e === 'string' ? e : e.message || t('login.connectionError')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-wrapper">
    <!-- Language Switcher -->
    <button class="lang-btn" :title="locale === 'fr' ? 'Switch to English' : 'Passer en français'" @click="toggleLocale">
      <i class="pi pi-globe"></i>
      <span>{{ locale.toUpperCase() }}</span>
    </button>

    <!-- Header -->
    <div class="login-header">
      <div class="login-icon">
        <i class="pi pi-database" style="font-size: 2.5rem; color: white"></i>
      </div>
      <h1 class="login-title">{{ t('login.title') }}</h1>
      <p class="login-subtitle">{{ t('login.subtitle') }}</p>
    </div>

    <!-- Login Card -->
    <div class="login-card">
      <!-- Settings Button -->
      <button class="settings-btn" :title="t('login.advancedSettings')" @click="settingsVisible = true">
        <i class="pi pi-cog"></i>
      </button>

      <form class="login-form" @submit.prevent="handleSubmit">
        <!-- Database Host -->
        <div class="form-row">
          <div class="form-field form-field-grow">
            <label for="host">{{ t('login.host') }}</label>
            <IconField>
              <InputIcon class="pi pi-database" />
              <InputText
                id="host"
                v-model="host"
                :placeholder="t('login.hostPlaceholder')"
                :disabled="loading"
                fluid
              />
            </IconField>
          </div>
          <div class="form-field form-field-port">
            <label for="port">{{ t('login.port') }}</label>
            <InputNumber
              id="port"
              v-model="port"
              :useGrouping="false"
              :disabled="loading"
              fluid
            />
          </div>
        </div>

        <!-- Database Name -->
        <div class="form-field">
          <label for="database">{{ t('login.database') }}</label>
          <IconField>
            <InputIcon class="pi pi-server" />
            <InputText
              id="database"
              v-model="database"
              :placeholder="t('login.databasePlaceholder')"
              :disabled="loading"
              fluid
            />
          </IconField>
        </div>

        <!-- Username -->
        <div class="form-field">
          <label for="username">{{ t('login.username') }}</label>
          <IconField>
            <InputIcon class="pi pi-user" />
            <InputText
              id="username"
              v-model="username"
              :placeholder="t('login.usernamePlaceholder')"
              :disabled="loading"
              fluid
            />
          </IconField>
        </div>

        <!-- Password -->
        <div class="form-field">
          <label for="password">{{ t('login.password') }}</label>
          <IconField>
            <InputIcon class="pi pi-lock" />
            <InputText
              id="password"
              v-model="password"
              type="password"
              :placeholder="t('login.passwordPlaceholder')"
              :disabled="loading"
              fluid
            />
          </IconField>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="login-error">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ error }}</span>
        </div>

        <!-- Connect Button -->
        <Button
          type="submit"
          :label="loading ? t('login.connecting') : t('login.connect')"
          :icon="loading ? 'pi pi-spin pi-spinner' : 'pi pi-sign-in'"
          class="connect-btn"
          :disabled="loading"
          fluid
        />
      </form>

      <!-- Info -->
      <div class="login-info">
        <p>{{ t('login.info') }}</p>
      </div>
    </div>

    <!-- Footer -->
    <p class="login-footer">{{ t('login.footer') }}</p>

    <SettingsDialog v-model:visible="settingsVisible" />
  </div>
</template>

<style scoped>
.login-wrapper {
  position: relative;
  width: 100%;
  max-width: 28rem;
  min-height: 100vh;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.lang-btn {
  position: fixed;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(51, 65, 85, 0.5);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
  font-family: inherit;
  font-weight: 500;
}

.lang-btn:hover {
  background: rgba(51, 65, 85, 0.5);
  color: white;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 5rem;
  background: linear-gradient(135deg, #2563eb, #06b6d4);
  border-radius: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 10px 25px rgba(37, 99, 235, 0.3);
}

.login-title {
  font-size: 2.25rem;
  font-weight: 700;
  background: linear-gradient(to right, #60a5fa, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.login-subtitle {
  color: #94a3b8;
  font-size: 0.95rem;
}

.login-card {
  position: relative;
  background: rgba(30, 41, 59, 0.5);
  backdrop-filter: blur(12px);
  border-radius: 1rem;
  border: 1px solid rgba(51, 65, 85, 0.5);
  padding: 2rem;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
}

.settings-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 0.5rem;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.1rem;
}

.settings-btn:hover {
  background: rgba(51, 65, 85, 0.5);
  color: white;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #cbd5e1;
}

.connect-btn {
  background: linear-gradient(to right, #2563eb, #06b6d4) !important;
  border: none !important;
  padding: 0.75rem 1.5rem !important;
  font-weight: 500 !important;
  transition: all 0.2s !important;
}

.connect-btn:hover {
  box-shadow: 0 10px 25px rgba(37, 99, 235, 0.3) !important;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-field-grow {
  flex: 1;
}

.form-field-port {
  width: 6rem;
  flex-shrink: 0;
}

.login-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(127, 29, 29, 0.2);
  border: 1px solid rgba(185, 28, 28, 0.4);
  border-radius: 0.75rem;
  color: #f87171;
  font-size: 0.85rem;
}

.login-info {
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(30, 58, 138, 0.2);
  border: 1px solid rgba(29, 78, 216, 0.3);
  border-radius: 0.75rem;
}

.login-info p {
  font-size: 0.875rem;
  color: rgba(147, 197, 253, 0.8);
  text-align: center;
}

.login-footer {
  text-align: center;
  color: #64748b;
  font-size: 0.875rem;
  margin-top: 1.5rem;
}
</style>
