<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()

const submodules = [
  {
    key: 'teleport',
    icon: 'pi pi-send',
    color: '#06b6d4',
    gradient: 'linear-gradient(135deg, #0e7490, #06b6d4)',
    shadow: 'rgba(6, 182, 212, 0.25)',
    available: false,
  },
  {
    key: 'explorationXP',
    icon: 'pi pi-star',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #b45309, #f59e0b)',
    shadow: 'rgba(245, 158, 11, 0.25)',
    available: false,
  },
  {
    key: 'instances',
    icon: 'pi pi-building',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
    shadow: 'rgba(139, 92, 246, 0.25)',
    available: false,
  },
  {
    key: 'areaTrigger',
    icon: 'pi pi-bolt',
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #c2410c, #f97316)',
    shadow: 'rgba(249, 115, 22, 0.25)',
    available: false,
  },
  {
    key: 'accessRequirement',
    icon: 'pi pi-lock',
    color: '#f43f5e',
    gradient: 'linear-gradient(135deg, #be123c, #f43f5e)',
    shadow: 'rgba(244, 63, 94, 0.25)',
    available: true,
    route: '/maps/access-requirement',
  },
  {
    key: 'outdoorPvP',
    icon: 'pi pi-shield',
    color: '#60a5fa',
    gradient: 'linear-gradient(135deg, #1d4ed8, #60a5fa)',
    shadow: 'rgba(96, 165, 250, 0.25)',
    available: false,
  },
]
</script>

<template>
  <div class="map-module">
    <div class="map-header">
      <div class="map-header-icon">
        <i class="pi pi-map"></i>
      </div>
      <div>
        <h1 class="map-title">{{ t('map.title') }}</h1>
        <p class="map-description">{{ t('map.description') }}</p>
      </div>
    </div>

    <div class="submodule-grid">
      <div
        v-for="mod in submodules"
        :key="mod.key"
        class="submodule-card"
        :class="{ 'card-disabled': !mod.available }"
        @click="mod.available && mod.route ? router.push(mod.route) : undefined"
        :style="mod.available ? { cursor: 'pointer' } : {}"
      >
        <div class="card-icon-wrapper" :style="{ background: mod.gradient, boxShadow: `0 4px 16px ${mod.shadow}` }">
          <i :class="mod.icon" class="card-icon"></i>
        </div>

        <div class="card-content">
          <h2 class="card-title">{{ t(`map.submodules.${mod.key}.title`) }}</h2>
          <p class="card-desc">{{ t(`map.submodules.${mod.key}.description`) }}</p>
        </div>

        <div class="card-footer">
          <span v-if="!mod.available" class="badge-soon">
            <i class="pi pi-clock"></i>
            {{ t('map.comingSoon') }}
          </span>
          <span v-else class="badge-open">
            <i class="pi pi-arrow-right"></i>
          </span>
        </div>

        <div v-if="!mod.available" class="card-overlay"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-module {
  padding: 2rem;
  height: 100%;
  overflow-y: auto;
}

.map-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.map-header-icon {
  width: 3rem;
  height: 3rem;
  background: linear-gradient(135deg, #2563eb, #06b6d4);
  border-radius: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3);
  flex-shrink: 0;
}

.map-header-icon .pi {
  font-size: 1.4rem;
  color: white;
}

.map-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1.2;
  margin: 0;
}

.map-description {
  font-size: 0.875rem;
  color: #94a3b8;
  margin: 0.25rem 0 0;
}

.submodule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
}

.submodule-card {
  position: relative;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(51, 65, 85, 0.5);
  border-radius: 1rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.25s ease;
  overflow: hidden;
}

.submodule-card:not(.card-disabled):hover {
  border-color: rgba(6, 182, 212, 0.4);
  background: rgba(15, 23, 42, 0.8);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.card-disabled {
  cursor: default;
}

.card-icon-wrapper {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon {
  font-size: 1.25rem;
  color: white;
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #e2e8f0;
  margin: 0 0 0.375rem;
  line-height: 1.3;
}

.card-desc {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.card-footer {
  display: flex;
  align-items: center;
}

.badge-soon {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #475569;
  background: rgba(51, 65, 85, 0.4);
  border: 1px solid rgba(51, 65, 85, 0.5);
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
}

.badge-soon .pi {
  font-size: 0.7rem;
}

.badge-open {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: rgba(6, 182, 212, 0.1);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 0.5rem;
  color: #22d3ee;
  font-size: 0.875rem;
  margin-left: auto;
  transition: all 0.2s;
}

.submodule-card:not(.card-disabled):hover .badge-open {
  background: rgba(6, 182, 212, 0.2);
  border-color: rgba(6, 182, 212, 0.5);
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(2, 6, 23, 0.25);
  border-radius: inherit;
  pointer-events: none;
}
</style>
