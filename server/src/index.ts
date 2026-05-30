import express from 'express'
import cors from 'cors'
import invokeRouter from './routes/invoke.js'
import sseRouter from './routes/sse.js'

const PORT = 3001
const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json({ limit: '10mb' }))

// Routes
app.use('/api/invoke', invokeRouter)
app.use('/api/debug', sseRouter)

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`ISC Editor server running on http://localhost:${PORT}`)
})
