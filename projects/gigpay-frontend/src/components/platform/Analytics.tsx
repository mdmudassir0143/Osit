import React, { useEffect, useState } from 'react'
import algosdk from 'algosdk'

const ESCROW_APP_ID = Number(import.meta.env.VITE_ESCROW_APP_ID) || 0
const REGISTRY_APP_ID = Number(import.meta.env.VITE_REGISTRY_APP_ID) || 0
const TASK_APP_ID = Number(import.meta.env.VITE_TASK_APP_ID) || 0

const INDEXER_SERVER = import.meta.env.VITE_INDEXER_SERVER || ''
const INDEXER_PORT = import.meta.env.VITE_INDEXER_PORT || ''
const INDEXER_TOKEN = import.meta.env.VITE_INDEXER_TOKEN || ''

interface AppStats {
  appId: number
  label: string
  txnCount: number | null
  loading: boolean
  error: string | null
}

const APP_CONFIGS = [
  { appId: ESCROW_APP_ID, label: 'Escrow Pool' },
  { appId: REGISTRY_APP_ID, label: 'Worker Registry' },
  { appId: TASK_APP_ID, label: 'Task Verification' },
]

interface AnalyticsProps {
  refreshKey: number
}

const Analytics: React.FC<AnalyticsProps> = ({ refreshKey }) => {
  const [stats, setStats] = useState<AppStats[]>(
    APP_CONFIGS.map((c) => ({ ...c, txnCount: null, loading: true, error: null })),
  )

  useEffect(() => {
    const indexer = new algosdk.Indexer(INDEXER_TOKEN, INDEXER_SERVER, INDEXER_PORT)

    APP_CONFIGS.forEach((config, i) => {
      if (!config.appId) {
        setStats((prev) => {
          const next = [...prev]
          next[i] = { ...next[i], loading: false, error: 'App ID not configured' }
          return next
        })
        return
      }

      indexer
        .searchForTransactions()
        .applicationID(config.appId)
        .do()
        .then((res: any) => {
          const count = res.transactions?.length ?? 0
          setStats((prev) => {
            const next = [...prev]
            next[i] = { ...next[i], txnCount: count, loading: false }
            return next
          })
        })
        .catch((err: any) => {
          console.error(`Analytics error for ${config.label}:`, err)
          setStats((prev) => {
            const next = [...prev]
            next[i] = { ...next[i], loading: false, error: 'Failed to fetch' }
            return next
          })
        })
    })
  }, [refreshKey])

  const totalTxns = stats.reduce((sum, s) => sum + (s.txnCount ?? 0), 0)
  const allLoaded = stats.every((s) => !s.loading)

  return (
    <div className="space-y-6">
      {/* Total banner */}
      <div className="bg-surface-raised border border-border rounded-lg p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl text-charcoal">Contract Analytics</h2>
          <span className="text-[10px] tracking-[0.2em] uppercase text-muted">On-Chain</span>
        </div>

        <div className="text-center py-4">
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-2">Total Transactions</div>
          {allLoaded ? (
            <div className="font-serif text-5xl text-terra">{totalTxns}</div>
          ) : (
            <div className="inline-block w-6 h-6 border-2 border-border border-t-terra animate-spin rounded-full" />
          )}
          <div className="text-xs text-muted mt-2">Across all contracts</div>
        </div>
      </div>

      {/* Per-contract cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.appId} className="bg-surface-raised border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted">{s.label}</div>
              <div className="w-2 h-2 rounded-full bg-sage" />
            </div>

            {s.loading ? (
              <div className="py-4 text-center">
                <div className="inline-block w-4 h-4 border-2 border-border border-t-terra animate-spin rounded-full" />
              </div>
            ) : s.error ? (
              <div className="text-sm text-red-500">{s.error}</div>
            ) : (
              <>
                <div className="font-serif text-3xl text-charcoal">{s.txnCount}</div>
                <div className="text-xs text-muted mt-1">transactions</div>
              </>
            )}

            <div className="mt-4 pt-3 border-t border-border-light">
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-1">App ID</div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted">{s.appId || '—'}</span>
                {s.appId > 0 && (
                  <a
                    href={`https://testnet.explorer.perawallet.app/application/${s.appId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] tracking-wider uppercase text-terra hover:text-terra-dark transition-colors"
                  >
                    Explorer
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Analytics
