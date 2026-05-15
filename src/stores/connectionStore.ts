import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { disconnectDb } from '@/services/database'
import type { ConnectionInfo } from '@/types/connection'

export const useConnectionStore = defineStore('connection', () => {
  const isConnected = ref(false)
  const connectionInfo = reactive<ConnectionInfo>({
    host: '',
    port: 3306,
    username: '',
    database: '',
  })

  function connect(credentials: { host: string; port: number; username: string; database: string }) {
    connectionInfo.host = credentials.host
    connectionInfo.port = credentials.port
    connectionInfo.username = credentials.username
    connectionInfo.database = credentials.database
    isConnected.value = true
  }

  async function disconnect() {
    try {
      await disconnectDb()
    } catch (e) {
      console.error('Disconnect error:', e)
    }
    isConnected.value = false
    connectionInfo.host = ''
    connectionInfo.port = 3306
    connectionInfo.username = ''
    connectionInfo.database = ''
  }

  return {
    isConnected,
    connectionInfo,
    connect,
    disconnect,
  }
})
