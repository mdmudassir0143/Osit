import { useCallback, useEffect, useState } from 'react'
import algosdk from 'algosdk'

const REGISTRY_APP_ID = Number(import.meta.env.VITE_REGISTRY_APP_ID) || 0
const ESCROW_APP_ID = Number(import.meta.env.VITE_ESCROW_APP_ID) || 0
const DELIVERY_APP_ID = Number(import.meta.env.VITE_TASK_APP_ID) || 0
const ALGOD_SERVER = import.meta.env.VITE_ALGOD_SERVER || ''
const ALGOD_PORT = import.meta.env.VITE_ALGOD_PORT || ''
const ALGOD_TOKEN = import.meta.env.VITE_ALGOD_TOKEN || ''
const INDEXER_SERVER = import.meta.env.VITE_INDEXER_SERVER || ''
const INDEXER_PORT = import.meta.env.VITE_INDEXER_PORT || ''
const INDEXER_TOKEN = import.meta.env.VITE_INDEXER_TOKEN || ''

export interface WorkerData {
  address: string
  name: string
  phone: string
  upiId: string
  rating: number      // 10-50 (1.0-5.0 stars)
  status: number      // 0=inactive, 1=active, 2=suspended
  registeredAt: number
  totalEarned: number
  tasksCompleted: number
}

export interface DeliveryData {
  id: number
  worker: string
  customerName: string
  pickup: string
  dropoff: string
  baseAmount: number
  finalAmount: number
  status: number      // 0=assigned, 1=picked_up, 2=delivered, 3=paid
  createdAt: number
  deliveredAt: number
}

export interface EscrowData {
  balance: number
  totalDeposited: number
  totalReleased: number
  appAddress: string
  usdcOptedIn: boolean
}

function decodeFixedString(data: Uint8Array, offset: number, length: number): string {
  const slice = data.slice(offset, offset + length)
  // Trim null bytes
  let end = slice.length
  while (end > 0 && slice[end - 1] === 0) end--
  return new TextDecoder().decode(slice.slice(0, end))
}

function readUint64(data: Uint8Array, offset: number): number {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  return Number(view.getBigUint64(offset))
}

function parseWorkerBox(address: string, data: Uint8Array): WorkerData | null {
  // 120 bytes: name(32) + phone(16) + upi_id(32) + rating(8) + status(8) + registered_at(8) + total_earned(8) + tasks_completed(8)
  if (data.length < 120) return null
  return {
    address,
    name: decodeFixedString(data, 0, 32),
    phone: decodeFixedString(data, 32, 16),
    upiId: decodeFixedString(data, 48, 32),
    rating: readUint64(data, 80),
    status: readUint64(data, 88),
    registeredAt: readUint64(data, 96),
    totalEarned: readUint64(data, 104),
    tasksCompleted: readUint64(data, 112),
  }
}

function parseDeliveryBox(id: number, data: Uint8Array): DeliveryData | null {
  // 168 bytes: worker(32) + customer_name(32) + pickup(32) + dropoff(32) + base_amount(8) + final_amount(8) + status(8) + created_at(8) + delivered_at(8)
  if (data.length < 168) return null
  return {
    id,
    worker: algosdk.encodeAddress(data.slice(0, 32)),
    customerName: decodeFixedString(data, 32, 32),
    pickup: decodeFixedString(data, 64, 32),
    dropoff: decodeFixedString(data, 96, 32),
    baseAmount: readUint64(data, 128),
    finalAmount: readUint64(data, 136),
    status: readUint64(data, 144),
    createdAt: readUint64(data, 152),
    deliveredAt: readUint64(data, 160),
  }
}

export function usePlatformData(refreshKey: number) {
  const [workers, setWorkers] = useState<WorkerData[]>([])
  const [deliveries, setDeliveries] = useState<DeliveryData[]>([])
  const [escrow, setEscrow] = useState<EscrowData>({ balance: 0, totalDeposited: 0, totalReleased: 0, appAddress: '', usdcOptedIn: false })
  const [loading, setLoading] = useState(true)

  const indexer = new algosdk.Indexer(INDEXER_TOKEN, INDEXER_SERVER, INDEXER_PORT)
  const algod = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT)

  const fetchWorkers = useCallback(async () => {
    if (!REGISTRY_APP_ID) return []
    try {
      const boxesResponse = await indexer.searchForApplicationBoxes(REGISTRY_APP_ID).do()
      const boxes = boxesResponse.boxes || []

      const workerList: WorkerData[] = []
      for (const box of boxes) {
        const nameBytes = box.name as Uint8Array
        if (nameBytes.length !== 36) continue
        const prefix = new TextDecoder().decode(nameBytes.slice(0, 4))
        if (prefix !== 'wrk_') continue

        const addrBytes = nameBytes.slice(4)
        const address = algosdk.encodeAddress(addrBytes)

        try {
          const boxValue = await algod.getApplicationBoxByName(REGISTRY_APP_ID, nameBytes).do()
          const data = boxValue.value as Uint8Array
          const worker = parseWorkerBox(address, data)
          if (worker) workerList.push(worker)
        } catch { /* skip unreadable box */ }
      }
      return workerList
    } catch (e) {
      console.error('fetchWorkers error:', e)
      return []
    }
  }, [])

  const fetchDeliveries = useCallback(async () => {
    if (!DELIVERY_APP_ID) return []
    try {
      const boxesResponse = await indexer.searchForApplicationBoxes(DELIVERY_APP_ID).do()
      const boxes = boxesResponse.boxes || []

      const deliveryList: DeliveryData[] = []
      for (const box of boxes) {
        const nameBytes = box.name as Uint8Array
        if (nameBytes.length !== 12) continue
        const prefix = new TextDecoder().decode(nameBytes.slice(0, 4))
        if (prefix !== 'dlv_') continue

        const idView = new DataView(nameBytes.buffer, nameBytes.byteOffset + 4, 8)
        const deliveryId = Number(idView.getBigUint64(0))

        try {
          const boxValue = await algod.getApplicationBoxByName(DELIVERY_APP_ID, nameBytes).do()
          const data = boxValue.value as Uint8Array
          const delivery = parseDeliveryBox(deliveryId, data)
          if (delivery) deliveryList.push(delivery)
        } catch { /* skip */ }
      }
      return deliveryList.sort((a, b) => b.createdAt - a.createdAt)
    } catch (e) {
      console.error('fetchDeliveries error:', e)
      return []
    }
  }, [])

  const fetchEscrow = useCallback(async () => {
    const empty: EscrowData = { balance: 0, totalDeposited: 0, totalReleased: 0, appAddress: '', usdcOptedIn: false }
    if (!ESCROW_APP_ID) return empty
    try {
      const appAddr = algosdk.getApplicationAddress(ESCROW_APP_ID).toString()
      const appInfo = await algod.getApplicationByID(ESCROW_APP_ID).do()
      const globalState = (appInfo as any).params?.['global-state'] || (appInfo as any).params?.globalState || []

      let totalDeposited = 0
      let totalReleased = 0
      for (const kv of globalState) {
        let key = ''
        if (typeof kv.key === 'string') key = atob(kv.key)
        else if (kv.key instanceof Uint8Array) key = new TextDecoder().decode(kv.key)
        const val = Number(kv.value?.uint ?? kv.value?.Uint ?? 0)
        if (key === 'total_deposited') totalDeposited = val
        if (key === 'total_released') totalReleased = val
      }

      let balance = 0
      let usdcOptedIn = false
      try {
        const acctInfo = await algod.accountInformation(appAddr).do()
        const assets = (acctInfo as any).assets || []
        const usdcAssetId = Number(import.meta.env.VITE_USDC_ASSET_ID) || 0
        for (const a of assets) {
          const aid = Number(a['asset-id'] ?? a.assetId ?? 0)
          if (aid === usdcAssetId) {
            balance = Number(a.amount || 0)
            usdcOptedIn = true
            break
          }
        }
      } catch { /* skip */ }

      return { balance, totalDeposited, totalReleased, appAddress: appAddr, usdcOptedIn }
    } catch (e) {
      console.error('fetchEscrow error:', e)
      return empty
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([fetchWorkers(), fetchDeliveries(), fetchEscrow()]).then(([w, d, e]) => {
      if (!cancelled) {
        setWorkers(w)
        setDeliveries(d)
        setEscrow(e)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [fetchWorkers, fetchDeliveries, fetchEscrow, refreshKey])

  return { workers, deliveries, escrow, loading }
}
