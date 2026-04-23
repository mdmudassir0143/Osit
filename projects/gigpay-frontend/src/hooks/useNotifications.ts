import { useCallback, useEffect, useRef, useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import algosdk from 'algosdk'

const ESCROW_APP_ID = Number(import.meta.env.VITE_ESCROW_APP_ID) || 0
const REGISTRY_APP_ID = Number(import.meta.env.VITE_REGISTRY_APP_ID) || 0
const TASK_APP_ID = Number(import.meta.env.VITE_TASK_APP_ID) || 0
const INDEXER_SERVER = import.meta.env.VITE_INDEXER_SERVER || ''
const INDEXER_PORT = import.meta.env.VITE_INDEXER_PORT || ''
const INDEXER_TOKEN = import.meta.env.VITE_INDEXER_TOKEN || ''

const POLL_INTERVAL = 30_000 // 30s
const STORAGE_KEY = 'gigpay_notif_last_seen'
const MAX_NOTIFICATIONS = 50

export type NotifType = 'delivery_assigned' | 'delivery_picked_up' | 'delivery_completed' | 'payment_received' | 'worker_added' | 'escrow_deposit' | 'escrow_release' | 'rating_changed'

export interface Notification {
  id: string
  type: NotifType
  title: string
  description: string
  timestamp: number // unix seconds
  txId: string
  read: boolean
}

function categorizeTransaction(tx: any, userAddress: string): Notification | null {
  const id = tx.id || tx['tx-id'] || ''
  const roundTime = tx['round-time'] || 0
  const appId = tx['application-transaction']?.['application-id'] || tx['created-application-index'] || 0
  const innerTxns = tx['inner-txns'] || []

  // App call transactions
  if (tx['tx-type'] === 'appl' && appId) {
    const appArgs = tx['application-transaction']?.['application-args'] || []
    const method = appArgs[0] ? atob(appArgs[0]) : ''

    // Worker Registry events
    if (appId === REGISTRY_APP_ID) {
      if (method.includes('add_worker')) {
        return {
          id, type: 'worker_added',
          title: 'Worker Registered',
          description: 'A new worker was added to the registry',
          timestamp: roundTime, txId: id, read: false,
        }
      }
      if (method.includes('update_rating')) {
        return {
          id, type: 'rating_changed',
          title: 'Rating Updated',
          description: 'A worker rating was updated',
          timestamp: roundTime, txId: id, read: false,
        }
      }
    }

    // Delivery Manager events
    if (appId === TASK_APP_ID) {
      if (method.includes('create_delivery') || method.includes('create_task')) {
        return {
          id, type: 'delivery_assigned',
          title: 'Delivery Created',
          description: 'A new delivery was assigned',
          timestamp: roundTime, txId: id, read: false,
        }
      }
      if (method.includes('pick_up') || method.includes('start_delivery')) {
        return {
          id, type: 'delivery_picked_up',
          title: 'Delivery Picked Up',
          description: 'A delivery was picked up',
          timestamp: roundTime, txId: id, read: false,
        }
      }
      if (method.includes('confirm') || method.includes('complete')) {
        return {
          id, type: 'delivery_completed',
          title: 'Delivery Completed',
          description: 'A delivery was confirmed and payment released',
          timestamp: roundTime, txId: id, read: false,
        }
      }
    }

    // Escrow events
    if (appId === ESCROW_APP_ID) {
      if (method.includes('deposit')) {
        return {
          id, type: 'escrow_deposit',
          title: 'Escrow Deposit',
          description: 'USDC was deposited into escrow',
          timestamp: roundTime, txId: id, read: false,
        }
      }
      if (method.includes('release')) {
        return {
          id, type: 'escrow_release',
          title: 'Payment Released',
          description: 'USDC was released from escrow',
          timestamp: roundTime, txId: id, read: false,
        }
      }
    }
  }

  // ASA transfer to user = payment received
  if (tx['tx-type'] === 'axfer') {
    const receiver = tx['asset-transfer-transaction']?.receiver || ''
    if (receiver === userAddress) {
      const amount = tx['asset-transfer-transaction']?.amount || 0
      return {
        id, type: 'payment_received',
        title: 'Payment Received',
        description: `Received ${(amount / 1_000_000).toFixed(2)} USDC`,
        timestamp: roundTime, txId: id, read: false,
      }
    }
  }

  // Check inner transactions for ASA transfers to user
  for (const inner of innerTxns) {
    if (inner['tx-type'] === 'axfer') {
      const receiver = inner['asset-transfer-transaction']?.receiver || ''
      if (receiver === userAddress) {
        const amount = inner['asset-transfer-transaction']?.amount || 0
        return {
          id, type: 'payment_received',
          title: 'Payment Received',
          description: `Received ${(amount / 1_000_000).toFixed(2)} USDC`,
          timestamp: roundTime, txId: id, read: false,
        }
      }
    }
  }

  return null
}

export function useNotifications() {
  const { activeAddress } = useWallet()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const seenIds = useRef(new Set<string>())

  const lastSeenTs = (): number => {
    try {
      return Number(localStorage.getItem(STORAGE_KEY) || '0')
    } catch { return 0 }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const now = Math.floor(Date.now() / 1000)
      localStorage.setItem(STORAGE_KEY, String(now))
      return prev.map((n) => ({ ...n, read: true }))
    })
  }, [])

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const fetchNotifications = useCallback(async () => {
    if (!activeAddress) return
    const appIds = [ESCROW_APP_ID, REGISTRY_APP_ID, TASK_APP_ID].filter(Boolean)
    if (appIds.length === 0) return

    setLoading(true)
    const indexer = new algosdk.Indexer(INDEXER_TOKEN, INDEXER_SERVER, INDEXER_PORT)
    const lastSeen = lastSeenTs()
    const allNotifs: Notification[] = []

    try {
      // Fetch recent transactions for each app
      for (const appId of appIds) {
        try {
          const result = await indexer.searchForTransactions()
            .applicationID(appId)
            .limit(20)
            .do()
          const txns = result.transactions || []
          for (const tx of txns as any[]) {
            if (seenIds.current.has(tx.id || tx['tx-id'])) continue
            const notif = categorizeTransaction(tx, activeAddress)
            if (notif) {
              notif.read = notif.timestamp <= lastSeen
              seenIds.current.add(notif.id)
              allNotifs.push(notif)
            }
          }
        } catch { /* indexer query failed for this app */ }
      }

      // Also fetch ASA transfers to user (direct payments)
      try {
        const result = await indexer.searchForTransactions()
          .address(activeAddress)
          .addressRole('receiver')
          .txType('axfer')
          .limit(10)
          .do()
        const txns = result.transactions || []
        for (const tx of txns as any[]) {
          const txId = tx.id || tx['tx-id']
          if (seenIds.current.has(txId)) continue
          const notif = categorizeTransaction(tx, activeAddress)
          if (notif) {
            notif.read = notif.timestamp <= lastSeen
            seenIds.current.add(notif.id)
            allNotifs.push(notif)
          }
        }
      } catch { /* skip */ }

      if (allNotifs.length > 0) {
        setNotifications((prev) => {
          const merged = [...allNotifs, ...prev]
          // Deduplicate by id
          const seen = new Set<string>()
          const deduped = merged.filter((n) => {
            if (seen.has(n.id)) return false
            seen.add(n.id)
            return true
          })
          return deduped
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, MAX_NOTIFICATIONS)
        })
      }
    } catch (e) {
      console.error('useNotifications fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [activeAddress])

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  return { notifications, unreadCount, loading, markAllRead, markRead, refetch: fetchNotifications }
}
