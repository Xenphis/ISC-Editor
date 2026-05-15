import { invoke } from '@tauri-apps/api/core'

export async function connectDb(
  host: string,
  port: number,
  user: string,
  password: string,
  database: string
): Promise<void> {
  return invoke('connect_db', { host, port, user, password, database })
}

export async function disconnectDb(): Promise<void> {
  return invoke('disconnect_db')
}
