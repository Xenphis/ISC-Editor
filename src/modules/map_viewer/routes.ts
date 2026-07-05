import type { RouteRecordRaw } from 'vue-router'

export const mapViewerRoutes: RouteRecordRaw[] = [
  {
    // Debug tool: produces the calibration entries baked into
    // data/zone-calibration.ts. Not linked from the sidebar.
    path: 'map-viewer/calibrate',
    name: 'map-viewer-calibrate',
    component: () => import('@/modules/map_viewer/pages/MapCalibrationPage.vue'),
  },
]
