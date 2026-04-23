import React from 'react'
import { WorkerData, DeliveryData } from '../../hooks/usePlatformData'

interface Props {
  workers: WorkerData[]
  deliveries: DeliveryData[]
}

function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function formatDate(ts: number): string {
  if (!ts) return ''
  return new Date(ts * 1000).toISOString().split('T')[0]
}

const STATUS_MAP: Record<number, string> = {
  0: 'Inactive',
  1: 'Active',
  2: 'Suspended',
}

const DELIVERY_STATUS: Record<number, string> = {
  0: 'Assigned',
  1: 'Picked Up',
  2: 'Delivered',
  3: 'Paid',
}

const ExportData: React.FC<Props> = ({ workers, deliveries }) => {
  const exportWorkers = () => {
    const header = 'address,name,phone,upi_id,rating,status,registered_at,total_earned_usdc,tasks_completed'
    const rows = workers.map((w) =>
      [
        w.address,
        `"${w.name}"`,
        w.phone,
        w.upiId,
        (w.rating / 10).toFixed(1),
        STATUS_MAP[w.status] || w.status,
        formatDate(w.registeredAt),
        (w.totalEarned / 1_000_000).toFixed(2),
        w.tasksCompleted,
      ].join(','),
    )
    downloadCSV(`gigpay_workers_${Date.now()}.csv`, [header, ...rows].join('\n'))
  }

  const exportDeliveries = () => {
    const header = 'id,worker,customer,pickup,dropoff,base_amount_usdc,final_amount_usdc,status,created_at,delivered_at'
    const rows = deliveries.map((d) =>
      [
        d.id,
        d.worker,
        `"${d.customerName}"`,
        `"${d.pickup}"`,
        `"${d.dropoff}"`,
        (d.baseAmount / 1_000_000).toFixed(2),
        (d.finalAmount / 1_000_000).toFixed(2),
        DELIVERY_STATUS[d.status] || d.status,
        formatDate(d.createdAt),
        formatDate(d.deliveredAt),
      ].join(','),
    )
    downloadCSV(`gigpay_deliveries_${Date.now()}.csv`, [header, ...rows].join('\n'))
  }

  return (
    <div className="bg-surface-raised border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-charcoal">Export Data</h3>
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted">CSV Download</span>
      </div>
      <div className="flex gap-3">
        <button
          onClick={exportWorkers}
          disabled={workers.length === 0}
          className="flex-1 py-2.5 text-xs font-medium text-charcoal border border-border rounded hover:bg-surface hover:border-terra/30 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Workers ({workers.length})
        </button>
        <button
          onClick={exportDeliveries}
          disabled={deliveries.length === 0}
          className="flex-1 py-2.5 text-xs font-medium text-charcoal border border-border rounded hover:bg-surface hover:border-terra/30 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Deliveries ({deliveries.length})
        </button>
      </div>
    </div>
  )
}

export default ExportData
