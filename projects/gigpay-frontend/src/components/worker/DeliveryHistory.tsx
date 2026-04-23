import React from 'react'
import { WorkerDelivery } from '../../hooks/useWorkerData'

interface DeliveryHistoryProps {
  deliveries: WorkerDelivery[]
}

const STATUS_LABELS: Record<number, { label: string; color: string; dot: string }> = {
  0: { label: 'Assigned', color: 'text-muted', dot: 'bg-muted/40' },
  1: { label: 'Picked Up', color: 'text-yellow-600', dot: 'bg-yellow-500' },
  2: { label: 'Delivered', color: 'text-sage', dot: 'bg-sage' },
  3: { label: 'Paid', color: 'text-terra', dot: 'bg-terra' },
}

const DeliveryHistory: React.FC<DeliveryHistoryProps> = ({ deliveries }) => {
  const paid = deliveries.filter((d) => d.status === 3)
  const active = deliveries.filter((d) => d.status < 3)

  return (
    <div className="nb-dash-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="nb-section-heading">Delivery History</h2>
        <span className="nb-tag bg-cream">
          {deliveries.length} {deliveries.length === 1 ? 'delivery' : 'deliveries'}
        </span>
      </div>

      {deliveries.length === 0 ? (
        <div className="py-10 text-center">
          <div className="text-muted text-sm font-display">No deliveries assigned yet</div>
        </div>
      ) : (
        <div className="space-y-0">
          {active.length > 0 && (
            <>
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-3">Active</div>
              {active.map((d) => {
                const statusInfo = STATUS_LABELS[d.status] || STATUS_LABELS[0]
                return (
                  <div
                    key={d.id}
                    className="flex items-center gap-4 py-3.5 nb-table-row"
                  >
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-lg border-2 border-sun bg-sun-light text-charcoal">
                      <span className="text-xs font-mono font-bold">#{d.id}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-charcoal font-display font-semibold">{d.customerName}</div>
                      <div className="text-[11px] text-muted truncate">{d.pickup} → {d.dropoff}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-mono font-bold text-charcoal">${(d.baseAmount / 1_000_000).toFixed(2)}</div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                      <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                      <span className={`text-xs font-display font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
                    </span>
                  </div>
                )
              })}
            </>
          )}

          {paid.length > 0 && (
            <>
              <div className={`text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-3 ${active.length > 0 ? 'mt-6' : ''}`}>
                Completed & Paid
              </div>
              {paid.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-4 py-3.5 nb-table-row"
                >
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded-lg border-2 border-terra bg-terra-light text-terra">
                    <span className="text-xs font-mono font-bold">#{d.id}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-charcoal font-display font-semibold">{d.customerName}</div>
                    <div className="text-[11px] text-muted truncate">{d.pickup} → {d.dropoff}</div>
                    {d.deliveredAt > 0 && (
                      <div className="text-[10px] text-muted mt-0.5 font-mono">
                        {new Date(d.deliveredAt * 1000).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-mono font-bold text-terra">
                      +${(d.finalAmount / 1_000_000).toFixed(2)}
                    </div>
                    {d.finalAmount !== d.baseAmount && (
                      <div className="text-[10px] font-mono text-muted line-through">
                        ${(d.baseAmount / 1_000_000).toFixed(2)}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-terra font-display font-bold flex-shrink-0">Paid ✓</span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default DeliveryHistory
