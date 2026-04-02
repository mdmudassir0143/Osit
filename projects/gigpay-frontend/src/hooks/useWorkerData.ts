import { useCallback, useEffect, useState } from 'react'
import algosdk from 'algosdk'

const REGISTRY_APP_ID = Number(import.meta.env.VITE_REGISTRY_APP_ID) || 0
const DELIVERY_APP_ID = Number(import.meta.env.VITE_TASK_APP_ID) || 0
const ALGOD_SERVER = import.meta.env.VITE_ALGOD_SERVER || ''
const ALGOD_PORT = import.meta.env.VITE_ALGOD_PORT || ''
const ALGOD_TOKEN = import.meta.env.VITE_ALGOD_TOKEN || ''
const INDEXER_SERVER = import.meta.env.VITE_INDEXER_SERVER || ''
const INDEXER_PORT = import.meta.env.VITE_INDEXER_PORT || ''
const INDEXER_TOKEN = import.meta.env.VITE_INDEXER_TOKEN || ''

export interface WorkerProfile {
  address: string
  name: string
  phone: string
  upiId: string
  rating: number
  status: number
  registeredAt: number
  totalEarned: number
  tasksCompleted: number
}

export interface WorkerDelivery {
  id: number
  customerName: string
  pickup: string
  dropoff: string
  baseAmount: number
  finalAmount: number
  status: number
  createdAt: number
  deliveredAt: number
}

function decodeFixedString(data: Uint8Array, offset: number, length: number): string {
  const slice = data.slice(offset, offset + length)
  let end = slice.length
  while (end > 0 && slice[end - 1] === 0) end--
  return new TextDecoder().decode(slice.slice(0, end))
}

function readUint64(data: Uint8Array, offset: number): number {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  return Number(view.getBigUint64(offset))
}

export function useWorkerData(workerAddress: string | undefined, refreshKey: number) {
  const [profile, setProfile] = useState<WorkerProfile | null>(null)
  const [deliveries, setDeliveries] = useState<WorkerDelivery[]>([])
  const [usdcBalance, setUsdcBalance] = useState(0)
  const [usdcOptedIn, setUsdcOptedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  const algod = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT)
  const indexer = new algosdk.Indexer(INDEXER_TOKEN, INDEXER_SERVER, INDEXER_PORT)

  const fetchProfile = useCallback(async (): Promise<WorkerProfile | null> => {
    if (!workerAddress || !REGISTRY_APP_ID) return null
    try {
      const workerBytes = algosdk.decodeAddress(workerAddress).publicKey
      const boxName = new Uint8Array([...new TextEncoder().encode('wrk_'), ...workerBytes])
      const boxValue = await algod.getApplicationBoxByName(REGISTRY_APP_ID, boxName).do()
      const data = boxValue.value as Uint8Array
      if (data.length < 120) return null
      return {
        address: workerAddress,
        name: decodeFixedString(data, 0, 32),
        phone: decodeFixedString(data, 32, 16),
        upiId: decodeFixedString(data, 48, 32),
        rating: readUint64(data, 80),
        status: readUint64(data, 88),
        registeredAt: readUint64(data, 96),
        totalEarned: readUint64(data, 104),
        tasksCompleted: readUint64(data, 112),
      }
    } catch {
      return null
    }
  }, [workerAddress])

  const fetchDeliveries = useCallback(async (): Promise<WorkerDelivery[]> => {
    if (!workerAddress || !DELIVERY_APP_ID) return []
    try {
      const boxesResponse = await indexer.searchForApplicationBoxes(DELIVERY_APP_ID).do()
      const boxes = boxesResponse.boxes || []

      const myDeliveries: WorkerDelivery[] = []
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
          if (data.length < 168) continue

          // Check if this delivery belongs to this worker
          const deliveryWorker = algosdk.encodeAddress(data.slice(0, 32))
          if (deliveryWorker !== workerAddress) continue

          myDeliveries.push({
            id: deliveryId,
            customerName: decodeFixedString(data, 32, 32),
            pickup: decodeFixedString(data, 64, 32),
            dropoff: decodeFixedString(data, 96, 32),
            baseAmount: readUint64(data, 128),
            finalAmount: readUint64(data, 136),
            status: readUint64(data, 144),
            createdAt: readUint64(data, 152),
            deliveredAt: readUint64(data, 160),
          })
        } catch { /* skip */ }
      }
      return myDeliveries.sort((a, b) => b.createdAt - a.createdAt)
    } catch {
      return []
    }
  }, [workerAddress])

  const fetchUsdcInfo = useCallback(async (): Promise<{ balance: number; optedIn: boolean }> => {
    if (!workerAddress) return { balance: 0, optedIn: false }
    try {
      const acctInfo = await algod.accountInformation(workerAddress).do()
      const assets = (acctInfo as any).assets || []
      const usdcAssetId = Number(import.meta.env.VITE_USDC_ASSET_ID) || 0
      for (const a of assets) {
        const aid = Number(a['asset-id'] ?? a.assetId ?? 0)
        if (aid === usdcAssetId) return { balance: Number(a.amount || 0), optedIn: true }
      }
      return { balance: 0, optedIn: false }
    } catch {
      return { balance: 0, optedIn: false }
    }
  }, [workerAddress])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([fetchProfile(), fetchDeliveries(), fetchUsdcInfo()]).then(([p, d, u]) => {
      if (!cancelled) {
        setProfile(p)
        setDeliveries(d)
        setUsdcBalance(u.balance)
        setUsdcOptedIn(u.optedIn)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [fetchProfile, fetchDeliveries, fetchUsdcInfo, refreshKey])

  return { profile, deliveries, usdcBalance, usdcOptedIn, loading }
}
