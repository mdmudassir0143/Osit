import React, { useState } from 'react'
import { type WorkerDelivery, type WorkerProfile } from '../../hooks/useWorkerData'
import { buildInvoiceData } from '../../utils/invoice'
import { generatePayoutReceipt } from '../../utils/pdf'

interface Props {
  deliveries: WorkerDelivery[]
  rating: number
  profile?: WorkerProfile | null
}

const STATUS_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: 'Assigned', color: 'bg-sun-light text-charcoal border-2 border-sun/30' },
  1: { label: 'Picked Up', color: 'bg-sage-light text-charcoal border-2 border-sage/30' },
  2: { label: 'Delivered', color: 'bg-sage text-white border-2 border-sage' },
  3: { label: 'Paid', color: 'bg-terra text-white border-2 border-terra' },
}

function formatDate(ts: number): string {
  if (!ts) return '—'
  const d = new Date(ts * 1000)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function computeMultiplier(rating: number): number {
  return (40 + (rating * 22) / 10) / 100
}

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const EarningsBreakdown: React.FC<Props> = ({ deliveries, rating, profile }) => {
  const [showAll, setShowAll] = useState(false)
  const paidDeliveries = deliveries.filter((d) => d.status === 3)
  const multiplier = computeMultiplier(rating)
  const displayed = showAll ? paidDeliveries : paidDeliveries.slice(0, 5)

  const handleDownloadReceipt = (d: WorkerDelivery) => {
    if (!profile) return
    const invoice = buildInvoiceData(
      { ...d, id: d.id },
      { name: profile.name, address: profile.address, phone: profile.phone, upiId: profile.upiId, rating: profile.rating },
    )
    generatePayoutReceipt(invoice)
  }

  const handleDownloadAll = () => {
    if (!profile) return
    for (const d of paidDeliveries) {
      handleDownloadReceipt(d)
    }
  }

  const chartData = paidDeliveries.slice(0, 7).reverse()
  const maxAmount = Math.max(...chartData.map((d) => d.finalAmount), 1)

  return (
    <div className="nb-dash-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="nb-section-heading">Earnings Breakdown</h2>
        <div className="flex items-center gap-2">
          <span className="nb-tag bg-cream">Multiplier</span>
          <span className="text-sm font-mono font-bold text-terra">{(multiplier * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Mini bar chart */}
      {chartData.length > 0 && (
        <div className="mb-6">
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-3">Recent Earnings Trend</div>
          <div className="flex items-end gap-1.5 h-16">
            {chartData.map((d) => {
              const height = Math.max((d.finalAmount / maxAmount) * 100, 8)
              return (
                <div key={d.id} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-terra rounded-t-lg border-2 border-charcoal transition-all hover:bg-terra-dark"
                    style={{ height: `${height}%` }}
                    title={`$${(d.finalAmount / 1_000_000).toFixed(2)} — ${formatDate(d.deliveredAt)}`}
                  />
                  <span className="text-[9px] text-muted font-mono">{formatDate(d.deliveredAt)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Per-delivery list */}
      {paidDeliveries.length === 0 ? (
        <div className="py-8 text-center">
          <span className="text-sm text-muted font-display">No completed deliveries yet</span>
        </div>
      ) : (
        <>
          <div className="space-y-0 divide-y divide-charcoal/10">
            {displayed.map((d) => {
              const base = d.baseAmount / 1_000_000
              const final_ = d.finalAmount / 1_000_000
              const bonus = final_ - base
              const status = STATUS_LABELS[d.status] || STATUS_LABELS[0]
              return (
                <div key={d.id} className="py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-display font-semibold text-charcoal truncate">{d.customerName || `Delivery #${d.id}`}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-display font-bold ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="text-xs text-muted mt-0.5 font-mono">{formatDate(d.createdAt)}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-mono font-bold text-charcoal">${final_.toFixed(2)}</div>
                    {bonus > 0 ? (
                      <div className="text-[10px] text-sage font-mono">
                        ${base.toFixed(2)} + ${bonus.toFixed(2)} bonus
                      </div>
                    ) : (
                      <div className="text-[10px] text-muted font-mono">base ${base.toFixed(2)}</div>
                    )}
                  </div>
                  {profile && (
                    <button
                      onClick={() => handleDownloadReceipt(d)}
                      className="ml-2 p-1.5 rounded-lg border-2 border-charcoal/10 hover:border-charcoal hover:bg-charcoal hover:text-white text-muted transition-all flex-shrink-0"
                      title="Download receipt"
                    >
                      <DownloadIcon />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {paidDeliveries.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-4 text-xs text-terra hover:text-terra-dark font-display font-bold transition-colors"
            >
              {showAll ? 'Show less' : `Show all ${paidDeliveries.length} deliveries`}
            </button>
          )}

          {profile && paidDeliveries.length > 0 && (
            <button
              onClick={handleDownloadAll}
              className="mt-4 nb-btn-ghost flex items-center justify-center gap-2 w-full"
            >
              <DownloadIcon />
              Download All Receipts ({paidDeliveries.length})
            </button>
          )}

          <div className="mt-5 pt-4 border-t-2 border-charcoal/10 grid grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-1">Total Base</div>
              <div className="text-sm font-mono text-charcoal">
                ${(paidDeliveries.reduce((s, d) => s + d.baseAmount, 0) / 1_000_000).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-1">Total Bonus</div>
              <div className="text-sm font-mono text-sage">
                +${((paidDeliveries.reduce((s, d) => s + d.finalAmount - d.baseAmount, 0)) / 1_000_000).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-1">Total Final</div>
              <div className="text-sm font-mono font-bold text-charcoal">
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
