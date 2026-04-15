import React, { useEffect, useMemo, useState } from 'react'
import algosdk from 'algosdk'
import { WorkerData, DeliveryData, EscrowData } from '../../hooks/usePlatformData'

const ESCROW_APP_ID = Number(import.meta.env.VITE_ESCROW_APP_ID) || 0
const REGISTRY_APP_ID = Number(import.meta.env.VITE_REGISTRY_APP_ID) || 0
const TASK_APP_ID = Number(import.meta.env.VITE_TASK_APP_ID) || 0

const INDEXER_SERVER = import.meta.env.VITE_INDEXER_SERVER || ''
const INDEXER_PORT = import.meta.env.VITE_INDEXER_PORT || ''
const INDEXER_TOKEN = import.meta.env.VITE_INDEXER_TOKEN || ''

const APP_CONFIGS = [
  { appId: ESCROW_APP_ID, label: 'Escrow Pool', key: 'escrow' },
  { appId: REGISTRY_APP_ID, label: 'Worker Registry', key: 'registry' },
  { appId: TASK_APP_ID, label: 'Task Verification', key: 'task' },
]

interface TxnCountMap {
  [appId: number]: { count: number | null; loading: boolean }
}

interface RecentTxn {
  id: string
  type: string
  roundTime: number
  appId: number
}

interface AnalyticsProps {
  refreshKey: number
  workers: WorkerData[]
  deliveries: DeliveryData[]
  escrow: EscrowData
}

const Analytics: React.FC<AnalyticsProps> = ({ refreshKey, workers, deliveries, escrow }) => {
  const [txnCounts, setTxnCounts] = useState<TxnCountMap>({})
  const [recentTxns, setRecentTxns] = useState<RecentTxn[]>([])
  const [txnLoading, setTxnLoading] = useState(true)

  // Fetch transaction counts and recent txns from indexer
  useEffect(() => {
    const indexer = new algosdk.Indexer(INDEXER_TOKEN, INDEXER_SERVER, INDEXER_PORT)
    let cancelled = false
    setTxnLoading(true)

    const initial: TxnCountMap = {}
    APP_CONFIGS.forEach((c) => { initial[c.appId] = { count: null, loading: true } })
    setTxnCounts(initial)

    const allTxns: RecentTxn[] = []

    Promise.all(
      APP_CONFIGS.map((config) => {
        if (!config.appId) return Promise.resolve()
        return indexer
          .searchForTransactions()
          .applicationID(config.appId)
          .do()
          .then((res: any) => {
            const txns = res.transactions || []
            if (!cancelled) {
              setTxnCounts((prev) => ({
                ...prev,
                [config.appId]: { count: txns.length, loading: false },
              }))
              txns.forEach((t: any) => {
                allTxns.push({
                  id: t.id || '',
                  type: t['tx-type'] || 'appl',
                  roundTime: t['round-time'] || t.roundTime || 0,
                  appId: config.appId,
                })
              })
            }
          })
          .catch(() => {
            if (!cancelled) {
              setTxnCounts((prev) => ({
                ...prev,
                [config.appId]: { count: null, loading: false },
              }))
            }
          })
      }),
    ).then(() => {
      if (!cancelled) {
        allTxns.sort((a, b) => b.roundTime - a.roundTime)
        setRecentTxns(allTxns)
        setTxnLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [refreshKey])

  // Derived stats from workers/deliveries/escrow
  const stats = useMemo(() => {
    const activeWorkers = workers.filter((w) => w.status === 1).length
    const suspendedWorkers = workers.filter((w) => w.status === 2).length
    const totalEarned = workers.reduce((s, w) => s + w.totalEarned, 0)
    const totalTasks = workers.reduce((s, w) => s + w.tasksCompleted, 0)
    const avgRating = workers.length > 0
      ? workers.reduce((s, w) => s + w.rating, 0) / workers.length / 10
      : 0

    const assigned = deliveries.filter((d) => d.status === 0).length
    const pickedUp = deliveries.filter((d) => d.status === 1).length
    const delivered = deliveries.filter((d) => d.status === 2).length
    const paid = deliveries.filter((d) => d.status === 3).length
    const completionRate = deliveries.length > 0
      ? Math.round((paid / deliveries.length) * 100)
      : 0

    const avgPayout = paid > 0
      ? deliveries.filter((d) => d.status === 3).reduce((s, d) => s + d.finalAmount, 0) / paid
      : 0

    const escrowUtilization = escrow.totalDeposited > 0
      ? Math.round((escrow.totalReleased / escrow.totalDeposited) * 100)
      : 0

    return {
      activeWorkers, suspendedWorkers, totalEarned, totalTasks, avgRating,
      assigned, pickedUp, delivered, paid, completionRate, avgPayout, escrowUtilization,
    }
  }, [workers, deliveries, escrow])

  // Worker leaderboard — top 5 by earnings
  const leaderboard = useMemo(() => {
    return [...workers]
      .sort((a, b) => b.totalEarned - a.totalEarned)
      .slice(0, 5)
  }, [workers])

  // Txn volume by day (last 7 days)
  const dailyVolume = useMemo(() => {
    const now = Math.floor(Date.now() / 1000)
    const days: { label: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const dayStart = now - i * 86400
      const dayEnd = dayStart + 86400
      const dayLabel = new Date(dayStart * 1000).toLocaleDateString('en-US', { weekday: 'short' })
      const count = recentTxns.filter((t) => t.roundTime >= dayStart && t.roundTime < dayEnd).length
      days.push({ label: dayLabel, count })
    }
    return days
  }, [recentTxns])

  const maxDayCount = Math.max(...dailyVolume.map((d) => d.count), 1)

  const totalTxnCount = APP_CONFIGS.reduce((s, c) => s + (txnCounts[c.appId]?.count ?? 0), 0)

  const fmtUsdc = (v: number) => `$${(v / 1_000_000).toFixed(2)}`
  const short = (addr: string) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '—'

  return (
    <div className="space-y-6">
      {/* ── Row 1: Key Metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Transactions" value={txnLoading ? null : totalTxnCount} accent="terra" />
        <MetricCard label="Escrow Balance" value={fmtUsdc(escrow.balance)} accent="sage" />
        <MetricCard label="Total Released" value={fmtUsdc(escrow.totalReleased)} accent="terra" />
        <MetricCard label="Escrow Utilization" value={`${stats.escrowUtilization}%`} accent="sage" />
      </div>

      {/* ── Row 2: Workers + Deliveries stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <MiniStat label="Active Workers" value={stats.activeWorkers} />
        <MiniStat label="Avg Rating" value={`${stats.avgRating.toFixed(1)} ★`} />
        <MiniStat label="Assigned" value={stats.assigned} />
        <MiniStat label="In Transit" value={stats.pickedUp} />
        <MiniStat label="Completed" value={stats.paid} color="text-sage" />
        <MiniStat label="Completion" value={`${stats.completionRate}%`} />
      </div>

      {/* ── Row 3: Daily Volume Chart + Per-Contract Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-surface-raised border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-medium text-charcoal">Transaction Volume (7 days)</h3>
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted">On-Chain</span>
          </div>
          <div className="flex items-end gap-2 h-36">
            {dailyVolume.map((day) => (
              <div key={day.label} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-mono text-muted">{day.count || ''}</span>
                <div className="w-full relative" style={{ height: '100px' }}>
                  <div
                    className="absolute bottom-0 w-full bg-terra/80 rounded-t transition-all duration-500"
                    style={{ height: `${Math.max((day.count / maxDayCount) * 100, day.count > 0 ? 6 : 0)}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted">{day.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Per-contract txn counts */}
        <div className="bg-surface-raised border border-border rounded-lg p-6">
          <h3 className="text-sm font-medium text-charcoal mb-5">By Contract</h3>
          <div className="space-y-4">
            {APP_CONFIGS.map((config) => {
              const data = txnCounts[config.appId]
              const count = data?.count ?? 0
              const pct = totalTxnCount > 0 ? Math.round((count / totalTxnCount) * 100) : 0
              return (
                <div key={config.appId}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-charcoal">{config.label}</span>
                    <span className="font-mono text-xs text-muted">
                      {data?.loading ? '...' : count}
                    </span>
                  </div>
                  <div className="h-2 bg-border-light rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        config.key === 'escrow' ? 'bg-terra' : config.key === 'registry' ? 'bg-sage' : 'bg-charcoal/30'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-[10px] text-muted">ID: {config.appId || '—'}</span>
                    <span className="font-mono text-[10px] text-muted">{pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Row 4: Leaderboard + Delivery Pipeline ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Worker Leaderboard */}
        <div className="bg-surface-raised border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-medium text-charcoal">Top Workers</h3>
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted">By Earnings</span>
          </div>
          {leaderboard.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted">No workers yet</div>
          ) : (
            <div className="space-y-0">
              {leaderboard.map((w, i) => {
                const maxEarned = leaderboard[0]?.totalEarned || 1
                const pct = Math.round((w.totalEarned / maxEarned) * 100)
                return (
                  <div key={w.address} className="flex items-center gap-3 py-3 border-b border-border-light last:border-0">
                    <span className={`w-6 h-6 flex items-center justify-center rounded text-xs font-medium ${
                      i === 0 ? 'bg-terra text-white' : 'bg-border-light text-muted'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium text-charcoal truncate">{w.name || short(w.address)}</span>
                          <span className="text-[10px] text-terra">{(w.rating / 10).toFixed(1)}★</span>
                        </div>
                        <span className="font-mono text-xs text-charcoal ml-2 flex-shrink-0">{fmtUsdc(w.totalEarned)}</span>
                      </div>
                      <div className="h-1.5 bg-border-light rounded-full overflow-hidden">
                        <div className="h-full bg-sage rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-mono text-[10px] text-muted">{w.tasksCompleted} tasks</span>
                        <span className="font-mono text-[10px] text-muted">{short(w.address)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Delivery Pipeline */}
        <div className="bg-surface-raised border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-medium text-charcoal">Delivery Pipeline</h3>
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted">{deliveries.length} Total</span>
          </div>

          {deliveries.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted">No deliveries yet</div>
          ) : (
            <>
              {/* Funnel bars */}
              <div className="space-y-3 mb-6">
                {[
                  { label: 'Assigned', count: stats.assigned, color: 'bg-charcoal/20' },
                  { label: 'Picked Up', count: stats.pickedUp, color: 'bg-terra/60' },
                  { label: 'Delivered', count: stats.delivered, color: 'bg-terra' },
                  { label: 'Paid', count: stats.paid, color: 'bg-sage' },
                ].map((stage) => {
                  const pct = deliveries.length > 0 ? Math.round((stage.count / deliveries.length) * 100) : 0
                  return (
                    <div key={stage.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-charcoal">{stage.label}</span>
                        <span className="font-mono text-xs text-muted">{stage.count}</span>
                      </div>
                      <div className="h-2.5 bg-border-light rounded-full overflow-hidden">
                        <div className={`h-full ${stage.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-light">
                <div>
                  <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-1">Avg Payout</div>
                  <div className="font-serif text-xl text-charcoal">{fmtUsdc(stats.avgPayout)}</div>
                </div>
                <div>
                  <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-1">Total Paid Out</div>
                  <div className="font-serif text-xl text-sage">{fmtUsdc(stats.totalEarned)}</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Row 5: Contract Links ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {APP_CONFIGS.map((config) => (
          <div key={config.appId} className="bg-surface-raised border border-border rounded-lg px-5 py-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-charcoal">{config.label}</div>
              <div className="font-mono text-[10px] text-muted mt-0.5">App ID: {config.appId || '—'}</div>
            </div>
            {config.appId > 0 && (
              <a
                href={`https://testnet.explorer.perawallet.app/application/${config.appId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] tracking-wider uppercase text-terra hover:text-terra-dark transition-colors border border-terra/30 px-2.5 py-1 rounded"
              >
                Explorer
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Sub-components ── */

function MetricCard({ label, value, accent }: { label: string; value: string | number | null; accent: 'terra' | 'sage' }) {
  return (
    <div className="bg-surface-raised border border-border rounded-lg p-5">
      <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-2">{label}</div>
      {value === null ? (
        <div className="inline-block w-5 h-5 border-2 border-border border-t-terra animate-spin rounded-full" />
      ) : (
        <div className={`font-serif text-2xl ${accent === 'terra' ? 'text-terra' : 'text-sage'}`}>{value}</div>
      )}
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-surface-raised border border-border rounded-lg px-4 py-3">
      <div className="text-[10px] tracking-[0.15em] uppercase text-muted mb-1">{label}</div>
      <div className={`font-serif text-lg ${color || 'text-charcoal'}`}>{value}</div>
    </div>
  )
}

export default Analytics
