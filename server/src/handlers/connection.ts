import { connect, disconnect } from '../db.js'

export async function connect_db(params: {
  host: string, port: number, user: string, password: string, database: string
}): Promise<null> {
  await connect(params.host, params.port, params.user, params.password, params.database)
  return null
}

export async function disconnect_db(_params: Record<string, never>): Promise<null> {
  await disconnect()
  return null
}
