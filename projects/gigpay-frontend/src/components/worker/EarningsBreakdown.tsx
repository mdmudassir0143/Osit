import React, { useState } from 'react'
import { type WorkerDelivery } from '../../hooks/useWorkerData'

interface Props {
  deliveries: WorkerDelivery[]
  rating: number
}

const STATUS_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: 'Assigned', color: 'bg-sun-light text-charcoal' },
  1: { label: 'Picked Up', color: 'bg-sage-light text-charcoal' },
  2: { label: 'Delivered', color: 'bg-sage text-white' },
  3: { label: 'Paid', color: 'bg-terra text-white' },
}

function formatDate(ts: number): string {
  if (!ts) return '—'
  const d = new Date(ts * 1000)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function computeMultiplier(rating: number): number {
  // multiplier = 40 + (rating × 22) / 10, rating is 10-50
  return (40 + (rating * 22) / 10) / 100
}

const EarningsBreakdown: React.FC<Props> = ({ deliveries, rating }) => {
  const [showAll, setShowAll] = useState(false)
  const paidDeliveries = deliveries.filter((d) => d.status === 3)
  const multiplier = computeMultiplier(rating)
  const displayed = showAll ? paidDeliveries : paidDeliveries.slice(0, 5)

  // Cumulative earnings for mini chart (last 7 paid deliveries, newest first → reverse for left-to-right)
  const chartData = paidDeliveries.slice(0, 7).reverse()
  const maxAmount = Math.max(...chartData.map((d) => d.finalAmount), 1)

  return (
    <div className="bg-surface-raised border border-border rounded-lg p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl text-charcoal">Earnings Breakdown</h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-[0.2em] uppercase text-muted">Multiplier</span>
          <span className="text-sm font-mono font-medium text-terra">{(multiplier * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Mini bar chart — recent earnings trend */}
      {chartData.length > 0 && (
        <div className="mb-6">
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-3">Recent Earnings Trend</div>
          <div className="flex items-end gap-1.5 h-16">
            {chartData.map((d, i) => {
              const height = Math.max((d.finalAmount / maxAmount) * 100, 8)
              return (
                <div key={d.id} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-terra/80 rounded-t transition-all hover:bg-terra"
                    style={{ height: `${height}%` }}
                    title={`$${(d.finalAmount / 1_000_000).toFixed(2)} — ${formatDate(d.deliveredAt)}`}
                  />
                  <span className="text-[9px] text-muted">{formatDate(d.deliveredAt)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Per-delivery list */}
      {paidDeliveries.length === 0 ? (
        <div className="py-8 text-center">
          <span className="text-sm text-muted">No completed deliveries yet</span>
        </div>
      ) : (
        <>
          <div className="space-y-0 divide-y divide-border-light">
            {displayed.map((d) => {
              const base = d.baseAmount / 1_000_000
              const final_ = d.finalAmount / 1_000_000
              const bonus = final_ - base
              const status = STATUS_LABELS[d.status] || STATUS_LABELS[0]
              return (
                <div key={d.id} className="py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-charcoal truncate">{d.customerName || `Delivery #${d.id}`}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="text-xs text-muted mt-0.5">{formatDate(d.createdAt)}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-mono font-medium text-charcoal">${final_.toFixed(2)}</div>
                    {bonus > 0 ? (
                      <div className="text-[10px] text-sage font-mono">
                        ${base.toFixed(2)} + ${bonus.toFixed(2)} bonus
                      </div>
                    ) : (
                      <div className="text-[10px] text-muted font-mono">base ${base.toFixed(2)}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {paidDeliveries.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-4 text-xs text-terra hover:text-terra-dark font-medium transition-colors"
            >
              {showAll ? 'Show less' : `Show all ${paidDeliveries.length} deliveries`}
            </button>
          )}

          {/* Summary */}
          <div className="mt-5 pt-4 border-t border-border grid grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-1">Total Base</div>
              <div className="text-sm font-mono text-charcoal">
                ${(paidDeliveries.reduce((s, d) => s + d.baseAmount, 0) / 1_000_000).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-1">Total Bonus</div>
              <div className="text-sm font-mono text-sage">
                +${((paidDeliveries.reduce((s, d) => s + d.finalAmount - d.baseAmount, 0)) / 1_000_000).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-1">Total Final</div>
              <div className="text-sm font-mono font-semibold text-charcoal">
                ${(paidDeliveries.reduce((s, d) => s + d.finalAmount, 0) / 1_000_000).toFixed(2)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default EarningsBreakdown
