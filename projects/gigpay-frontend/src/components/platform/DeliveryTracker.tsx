import React, { useState } from 'react'
import { DeliveryData, WorkerData } from '../../hooks/usePlatformData'
import { useDeliveryManager } from '../../hooks/useDeliveryManager'
import { useConfirmAndPay } from '../../hooks/useConfirmAndPay'
import { useTransactionToast } from '../shared/TransactionToast'
import { ellipseAddress } from '../../utils/ellipseAddress'
import { calculatePayout } from '../../data/dummyWorkers'

interface DeliveryTrackerProps {
  deliveries: DeliveryData[]
  workers: WorkerData[]
  onUpdated: () => void
  statusOverrides: Record<number, number>
  onStatusOverride: (id: number, status: number) => void
}

const STATUS_LABELS: Record<number, { label: string; color: string; dot: string }> = {
  0: { label: 'Assigned', color: 'text-muted', dot: 'bg-muted/40' },
  1: { label: 'Picked Up', color: 'text-yellow-600', dot: 'bg-yellow-500' },
  2: { label: 'Delivered', color: 'text-sage', dot: 'bg-sage' },
  3: { label: 'Paid', color: 'text-terra', dot: 'bg-terra' },
}

const DeliveryTracker: React.FC<DeliveryTrackerProps> = ({ deliveries, workers, onUpdated, statusOverrides, onStatusOverride }) => {
  const { markPickedUp, loading: deliveryLoading } = useDeliveryManager()
  const { confirmAndPay, loading: payLoading } = useConfirmAndPay()
  const { showSuccess, showError, showInfo } = useTransactionToast()
  const [actionId, setActionId] = useState<number | null>(null)

  const loading = deliveryLoading || payLoading
  const workerMap = new Map(workers.map((w) => [w.address, w]))

  const handleConfirmAndPay = async (delivery: DeliveryData) => {
    const worker = workerMap.get(delivery.worker)
    const rating = worker?.rating || 30
    const finalAmount = calculatePayout(delivery.baseAmount, rating)

    setActionId(delivery.id)
    try {
      showInfo('Signing atomic transaction (4 calls in 1)...')
      await confirmAndPay(delivery.id, delivery.worker, rating, finalAmount)
      onStatusOverride(delivery.id, 3)
      showSuccess(`Payment of $${(finalAmount / 1_000_000).toFixed(2)} sent to ${worker?.name || ellipseAddress(delivery.worker, 4)}`)
      onUpdated()
    } catch (err: any) {
      showError(err.message || 'Payment failed')
    } finally {
      setActionId(null)
    }
  }

  const handleAction = async (delivery: DeliveryData) => {
    const effectiveStatus = statusOverrides[delivery.id] ?? delivery.status
    setActionId(delivery.id)
    try {
      if (effectiveStatus === 0) {
        await markPickedUp(delivery.id)
        onStatusOverride(delivery.id, 1)
        showSuccess('Marked as picked up')
        onUpdated()
      } else if (effectiveStatus === 1) {
        await handleConfirmAndPay(delivery)
        return
      }
    } catch (err: any) {
      showError(err.message || 'Action failed')
    } finally {
      setActionId(null)
    }
  }

  const getActionLabel = (status: number) => {
    if (status === 0) return 'Mark Picked Up'
    if (status === 1) return 'Delivered - Pay'
    return null
  }

  return (
    <div className="nb-dash-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="nb-section-heading">Deliveries</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 text-[10px] tracking-[0.15em] uppercase text-muted font-display font-semibold">
            <span>{deliveries.filter((d) => d.status < 2).length} active</span>
            <span>{deliveries.filter((d) => d.status === 3).length} paid</span>
          </div>
        </div>
      </div>

      {deliveries.length === 0 ? (
        <div className="py-10 text-center">
          <div className="text-muted text-sm font-display">No deliveries created yet</div>
        </div>
      ) : (
        <div className="space-y-0">
          <div className="grid grid-cols-7 gap-3 pb-3 border-b-2 border-charcoal/10 text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold">
            <div>ID</div>
            <div>Worker</div>
            <div>Customer</div>
            <div>Route</div>
            <div className="text-right">Amount</div>
            <div className="text-center">Status</div>
            <div className="text-right">Action</div>
          </div>

          {deliveries.map((d) => {
            const effectiveStatus = statusOverrides[d.id] ?? d.status
            const statusInfo = STATUS_LABELS[effectiveStatus] || STATUS_LABELS[0]
            const worker = workerMap.get(d.worker)
            const actionLabel = getActionLabel(effectiveStatus)
            const isActing = actionId === d.id && loading

            const previewPayout = effectiveStatus === 1 && worker
              ? calculatePayout(d.baseAmount, worker.rating)
              : null

            return (
              <div
                key={d.id}
                className="grid grid-cols-7 gap-3 py-3.5 nb-table-row items-center -mx-2 px-2 rounded"
              >
                <div className="font-mono text-xs text-muted">#{d.id}</div>
                <div>
                  <div className="text-sm text-charcoal font-display font-semibold">{worker?.name || ellipseAddress(d.worker, 4)}</div>
                  {worker && <div className="text-[10px] text-muted font-mono">{(worker.rating / 10).toFixed(1)}★ · {worker.upiId}</div>}
                </div>
                <div className="text-sm text-charcoal truncate">{d.customerName}</div>
                <div>
                  <div className="text-[11px] text-muted truncate">{d.pickup}</div>
                  <div className="text-[11px] text-charcoal truncate">{d.dropoff}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-charcoal">
                    ${(d.baseAmount / 1_000_000).toFixed(2)}
                  </div>
                  {d.finalAmount > 0 && effectiveStatus >= 2 && (
                    <div className="text-[10px] font-mono text-sage">
                      paid ${(d.finalAmount / 1_000_000).toFixed(2)}
                    </div>
                  )}
                  {previewPayout && (
                    <div className="text-[10px] font-mono text-muted">
                      → ${(previewPayout / 1_000_000).toFixed(2)}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                    <span className={`text-xs font-display font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
                  </span>
                </div>
                <div className="text-right">
                  {actionLabel && (
                    <button
                      onClick={() => effectiveStatus === 1 ? handleConfirmAndPay(d) : handleAction(d)}
                      disabled={loading}
                      className={`nb-btn-ghost !text-[10px] !py-1 ${effectiveStatus === 1 ? '!bg-sage !text-white !border-sage hover:!bg-sage/90' : ''}`}
                    >
                      {isActing ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-3 h-3 border border-current/30 border-t-current animate-spin rounded-full" />
                        </span>
                      ) : (
                        actionLabel
                      )}
                    </button>
                  )}
                  {effectiveStatus === 2 && (
                    <span className="text-[10px] text-sage font-display font-bold">Delivered</span>
                  )}
                  {effectiveStatus === 3 && (
                    <span className="text-[10px] text-terra font-display font-bold">Paid ✓</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DeliveryTracker
