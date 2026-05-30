import { Router } from 'express'
import { addSseClient, removeSseClient, setDebugEnabled } from '../debug.js'

const router = Router()

// GET /api/debug/stream — connexion SSE pour les logs SQL
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.flushHeaders()

  // Envoyer un commentaire pour maintenir la connexion ouverte
  res.write(': connected\n\n')

  addSseClient(res)

  req.on('close', () => {
    removeSseClient(res)
  })
})

// POST /api/debug/mode — activer/désactiver le debug SQL
router.post('/mode', (req, res) => {
  const { enabled } = req.body as { enabled: boolean }
  setDebugEnabled(!!enabled)
  res.json({ enabled: !!enabled })
})

export default router
