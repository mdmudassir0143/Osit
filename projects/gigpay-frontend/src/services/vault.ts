// Phase 6 swap target — replace with real encrypted vault (IPFS or hosted).
// V1 stub: store payload JSON in localStorage keyed by SHA-256 of the canonical
// JSON. The hash doubles as the on-chain content_cid AND content_hash.

export interface AttestationPayload {
  category: number
  claim: string
  rating?: number
  metadata?: Record<string, unknown>
}

const PREFIX = 'alora.vault.'

export async function uploadPayload(payload: AttestationPayload): Promise<{
  contentCid: Uint8Array
  contentHash: Uint8Array
}> {
  const json = canonicalStringify(payload)
  const data = new TextEncoder().encode(json)
  const hashBuf = await crypto.subtle.digest('SHA-256', data)
  const hash = new Uint8Array(hashBuf)
  localStorage.setItem(PREFIX + bytesToHex(hash), json)
  return { contentCid: hash, contentHash: hash }
}

export async function fetchPayload(contentCid: Uint8Array): Promise<AttestationPayload | null> {
  const item = localStorage.getItem(PREFIX + bytesToHex(contentCid))
  if (!item) return null
  try {
    return JSON.parse(item) as AttestationPayload
  } catch {
    return null
  }
}

function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) {
    return `[${value.map((v) => canonicalStringify(v)).join(',')}]`
  }
  const keys = Object.keys(value as Record<string, unknown>).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalStringify((value as Record<string, unknown>)[k])}`).join(',')}}`
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return out
}
