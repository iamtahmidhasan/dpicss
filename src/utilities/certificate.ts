import crypto from 'crypto'

/**
 * Human-readable certificate serial, e.g. DPI-2026-A1B2C3D4.
 * Collision probability is negligible for this format.
 */
export function generateCertificateSerial(): string {
  const year = new Date().getFullYear()
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `DPI-${year}-${suffix}`
}
