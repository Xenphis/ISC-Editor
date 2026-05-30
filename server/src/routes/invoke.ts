import { Router } from 'express'
import { handlers } from '../handlers/index.js'

const router = Router()

router.post('/', async (req, res) => {
  const { command, params } = req.body as { command: string; params?: Record<string, any> }

  if (!command) {
    res.status(400).send('Missing command')
    return
  }

  const handler = handlers[command]
  if (!handler) {
    res.status(404).send(`Unknown command: ${command}`)
    return
  }

  try {
    const result = await handler(params ?? {})
    // Tauri retourne null comme undefined, on normalise
    res.json(result ?? null)
  } catch (err: any) {
    // Tauri remonte les erreurs comme des strings — on reproduit ce comportement
    res.status(500).send(err?.message ?? String(err))
  }
})

export default router
