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
    <div className="bg-surface-raised border border-border rounded-lg p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl text-charcoal">Delivery History</h2>
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted">
          {deliveries.length} {deliveries.length === 1 ? 'delivery' : 'deliveries'}
        </span>
      </div>

      {deliveries.length === 0 ? (
        <div className="py-10 text-center">
          <div className="text-muted text-sm">No deliveries assigned yet</div>
        </div>
      ) : (
        <div className="space-y-0">
          {/* Active deliveries first */}
          {active.length > 0 && (
            <>
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-3">Active</div>
              {active.map((d) => {
                const statusInfo = STATUS_LABELS[d.status] || STATUS_LABELS[0]
                return (
                  <div
                    key={d.id}
                    className="flex items-center gap-4 py-3.5 border-b border-border-light"
                  >
                    <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded border border-yellow-200 bg-yellow-50 text-yellow-600">
                      <span className="text-xs font-mono font-medium">#{d.id}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-charcoal">{d.customerName}</div>
                      <div className="text-[11px] text-muted truncate">{d.pickup} → {d.dropoff}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-mono text-charcoal">${(d.baseAmount / 1_000_000).toFixed(2)}</div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 flex-shrink-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                      <span className={`text-xs ${statusInfo.color}`}>{statusInfo.label}</span>
                    </span>
                  </div>
                )
              })}
            </>
          )}

          {/* Completed deliveries */}
          {paid.length > 0 && (
            <>
              <div className={`text-[10px] tracking-[0.2em] uppercase text-muted mb-3 ${active.length > 0 ? 'mt-6' : ''}`}>
                Completed & Paid
              </div>
              {paid.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center gap-4 py-3.5 border-b border-border-light"
                >
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 rounded border border-terra/20 bg-terra-light text-terra">
                    <span className="text-xs font-mono font-medium">#{d.id}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-charcoal">{d.customerName}</div>
                    <div className="text-[11px] text-muted truncate">{d.pickup} → {d.dropoff}</div>
                    {d.deliveredAt > 0 && (
                      <div className="text-[10px] text-muted mt-0.5">
                        {new Date(d.deliveredAt * 1000).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-mono text-terra font-medium">
                      +${(d.finalAmount / 1_000_000).toFixed(2)}
                    </div>
                    {d.finalAmount !== d.baseAmount && (
                      <div className="text-[10px] font-mono text-muted line-through">
                        ${(d.baseAmount / 1_000_000).toFixed(2)}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-terra font-medium flex-shrink-0">Paid ✓</span>
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
