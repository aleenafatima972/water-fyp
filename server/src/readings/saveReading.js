import db from '../db.js'

// Missing → null (sensor not connected yet), out of range → undefined (rejected)
function reading(value, min, max) {
  if (value === undefined || value === null) return null
  const n = Number(value)
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined
}

const insertReading = db.prepare(`
  INSERT INTO sensor_readings (device_id, ph, turbidity, tds, temperature)
  VALUES (?, ?, ?, ?, ?)
`)

// Keep a week of history so the table doesn't grow forever (one row every few seconds)
const pruneOldReadings = db.prepare(`DELETE FROM sensor_readings WHERE created_at < datetime('now', '-7 days')`)

// Validates and stores one set of ESP32 readings. Returns { id } or { error }.
export function saveReading(deviceId, body) {
  const values = {
    ph: reading(body?.ph, 0, 14),
    turbidity: reading(body?.turbidity, 0, 4000),
    tds: reading(body?.tds, 0, 5000),
    temperature: reading(body?.temperature, -10, 100),
  }
  const bad = Object.keys(values).filter((k) => values[k] === undefined)
  if (bad.length) return { error: `Invalid reading: ${bad.join(', ')}` }

  const { lastInsertRowid } = insertReading.run(
    String(deviceId || 'esp32-1').slice(0, 50),
    values.ph, values.turbidity, values.tds, values.temperature,
  )
  if (lastInsertRowid % 500 === 0) pruneOldReadings.run()
  return { id: lastInsertRowid }
}
