import { Router } from 'express'
import crypto from 'node:crypto'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { saveReading } from '../readings/saveReading.js'

const router = Router()

// The ESP32 proves it's ours by sending DEVICE_KEY in the X-Device-Key header
function requireDeviceKey(req, res, next) {
  const expected = process.env.DEVICE_KEY
  const given = req.get('X-Device-Key') || ''
  if (!expected || given.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    return res.status(401).json({ error: 'Invalid device key' })
  }
  next()
}

const latestReading = db.prepare(`
  SELECT id, device_id, ph, turbidity, tds, temperature, created_at
  FROM sensor_readings
  ORDER BY id DESC
  LIMIT 1
`)

// ESP32 → server (push). When the firewall blocks this, the server polls the ESP32 instead (see readings/esp32Poller.js).
router.post('/', requireDeviceKey, (req, res) => {
  const body = req.body ?? {}
  const result = saveReading(body.deviceId, body)
  if (result.error) return res.status(400).json({ error: result.error })
  res.status(201).json({ id: result.id })
})

// Website → newest reading (logged-in users only)
router.get('/latest', requireAuth, (req, res) => {
  const row = latestReading.get()
  if (!row) return res.json({ reading: null })
  res.json({
    reading: {
      id: row.id,
      deviceId: row.device_id,
      ph: row.ph,
      turbidity: row.turbidity,
      tds: row.tds,
      temperature: row.temperature,
      receivedAt: row.created_at,
    },
  })
})

export default router
