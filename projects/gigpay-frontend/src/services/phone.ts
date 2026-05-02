// Phase 7 swap target — replace with real OTP verification.
// V1 stub: hash whatever the user typed. No verification.

const SALT = 'alora-v1'

export async function verifyAndHash(phone: string): Promise<Uint8Array> {
  const normalized = normalizePhone(phone)
  const data = new TextEncoder().encode(`${SALT}:${normalized}`)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return new Uint8Array(buf)
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '')
}

export function isValidPhone(phone: string): boolean {
  const n = normalizePhone(phone)
  return n.length >= 7 && n.length <= 16
}
