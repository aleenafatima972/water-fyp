import { saveReading } from './saveReading.js'

const POLL_MS = 5000
const TIMEOUT_MS = 3000

// Pulls readings from the ESP32's own web server (GET http://<host>/readings).
// Used when the laptop's firewall blocks the ESP32 from POSTing to us:
// the laptop can always open connections to the ESP32.
export function startEsp32Poller(host) {
  let failing = false

  async function poll() {
    try {
      const res = await fetch(`http://${host}/readings`, { signal: AbortSignal.timeout(TIMEOUT_MS) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = await res.json()
      const result = saveReading(body.deviceId, body)
      if (result.error) console.warn('ESP32 reading rejected:', result.error)
      if (failing) console.log(`ESP32 at ${host} is reachable again`)
      failing = false
    } catch (err) {
      // Log once per outage, not every 5 seconds
      if (!failing) console.warn(`Can't reach ESP32 at ${host}: ${err.message}`)
      failing = true
    }
  }

  poll()
  setInterval(poll, POLL_MS)
  console.log(`Polling ESP32 at http://${host}/readings every ${POLL_MS / 1000}s`)
}
