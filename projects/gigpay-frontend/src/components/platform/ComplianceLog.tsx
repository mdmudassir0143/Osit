import React, { useMemo } from 'react'
import { type DeliveryData, type WorkerData } from '../../hooks/usePlatformData'
import { generateInvoiceNumber, formatDate, formatUSDC } from '../../utils/invoice'

interface Props {
  workers: WorkerData[]
  deliveries: DeliveryData[]
}

interface LogEntry {
  timestamp: number
  type: 'payment' | 'worker_added' | 'delivery_created'
  title: string
  detail: string
  accent: string
  icon: string
}

const ComplianceLog: React.FC<Props> = ({ workers, deliveries }) => {
  const entries = useMemo(() => {
    const logs: LogEntry[] = []

    // Payment events from paid deliveries
    for (const d of deliveries) {
      if (d.status === 3) {
        logs.push({
          timestamp: d.deliveredAt,
          type: 'payment',
          title: `Payout ${generateInvoiceNumber(d.id)}`,
          detail: `$${formatUSDC(d.finalAmount)} USDC to ${d.worker.slice(0, 8)}...`,
          accent: 'bg-terra',
          icon: '→',
        })
      }

      logs.push({
        timestamp: d.createdAt,
        type: 'delivery_created',
        title: `Delivery #${d.id} created`,
        detail: `${d.customerName} — ${d.pickup} → ${d.dropoff}`,
        accent: 'bg-lavender',
        icon: '+',
      })
    }

    // Worker registrations
    for (const w of workers) {
      logs.push({
        timestamp: w.registeredAt,
        type: 'worker_added',
        title: `Worker registered: ${w.name}`,
        detail: `${w.address.slice(0, 8)}... — ${w.phone}`,
        accent: 'bg-sage',
        icon: '●',
      })
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 30)
  }, [workers, deliveries])

  return (
    <div className="nb-dash-card p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="nb-section-heading">Compliance Audit Log</h3>
        <span className="nb-tag bg-cream">On-chain verified</span>
      </div>

      {entries.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted font-display">No activity recorded yet</div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-charcoal/10" />

          <div className="space-y-0">
            {entries.map((entry, i) => (
              <div key={`${entry.type}-${entry.timestamp}-${i}`} className="flex items-start gap-4 py-3 group">
                {/* Dot */}
                <div className={`w-6 h-6 rounded-full ${entry.accent} border-2 border-charcoal flex items-center justify-center flex-shrink-0 z-10 text-white text-[10px] font-bold`}>
                  {entry.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-display font-bold text-charcoal truncate">{entry.title}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-display font-bold border ${
                      entry.type === 'payment' ? 'bg-terra/10 text-terra border-terra/20' :
                      entry.type === 'worker_added' ? 'bg-sage/10 text-sage border-sage/20' :
                      'bg-lavender/10 text-lavender border-lavender/20'
                    }`}>
                      {entry.type === 'payment' ? 'PAYOUT' : entry.type === 'worker_added' ? 'REGISTRY' : 'DELIVERY'}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted mt-0.5 font-mono truncate">{entry.detail}</div>
                </div>

                {/* Timestamp */}
                <div className="text-[10px] text-muted font-mono flex-shrink-0">
                  {formatDate(entry.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ComplianceLog
