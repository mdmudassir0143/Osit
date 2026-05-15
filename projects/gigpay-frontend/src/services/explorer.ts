// Block explorer URL helpers — Pera Explorer (testnet).
// Network is read from VITE_ALGOD_NETWORK so this works on mainnet too.

const network = (import.meta.env.VITE_ALGOD_NETWORK as string) || 'testnet'
const isMainnet = network === 'mainnet'

const BASE = isMainnet ? 'https://explorer.perawallet.app' : 'https://testnet.explorer.perawallet.app'

export function txUrl(txId: string): string {
  return `${BASE}/tx/${txId}`
}

export function appUrl(appId: bigint | number | string): string {
  return `${BASE}/application/${String(appId)}`
}

export function addressUrl(addr: string): string {
  return `${BASE}/address/${addr}`
}

export function blockUrl(round: bigint | number): string {
  return `${BASE}/block/${String(round)}`
}
