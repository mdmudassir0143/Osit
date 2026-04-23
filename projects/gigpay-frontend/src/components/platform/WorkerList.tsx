import React from 'react'
import { WorkerData } from '../../hooks/usePlatformData'
import { ellipseAddress } from '../../utils/ellipseAddress'

interface WorkerListProps {
  workers: WorkerData[]
}

const STATUS_MAP: Record<number, { label: string; dotColor: string; textColor: string }> = {
  0: { label: 'Inactive', dotColor: 'bg-muted/40', textColor: 'text-muted' },
  1: { label: 'Active', dotColor: 'bg-sage', textColor: 'text-sage' },
  2: { label: 'Suspended', dotColor: 'bg-terra', textColor: 'text-terra' },
}

const WorkerList: React.FC<WorkerListProps> = ({ workers }) => {
  return (
    <div className="nb-dash-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="nb-section-heading">Registered Workers</h2>
        <span className="nb-tag bg-cream">
          {workers.length} {workers.length === 1 ? 'worker' : 'workers'}
        </span>
      </div>

      {workers.length === 0 ? (
        <div className="py-10 text-center">
          <div className="text-muted text-sm font-display">No workers registered yet</div>
        </div>
      ) : (
        <div className="space-y-0">
          <div className="grid grid-cols-7 gap-3 pb-3 border-b-2 border-charcoal/10 text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold">
            <div>Name</div>
            <div>Address</div>
            <div>Phone</div>
            <div>UPI / Bank</div>
            <div className="text-center">Rating</div>
            <div className="text-center">Status</div>
            <div className="text-right">Earned</div>
          </div>

          {workers.map((w) => {
            const statusInfo = STATUS_MAP[w.status] || { label: 'Unknown', dotColor: 'bg-muted/40', textColor: 'text-muted' }
            const stars = w.rating / 10
            return (
              <div
                key={w.address}
                className="grid grid-cols-7 gap-3 py-3.5 nb-table-row items-center -mx-2 px-2 rounded"
              >
                <div className="text-sm text-charcoal font-display font-semibold">{w.name || '—'}</div>
                <div className="font-mono text-xs text-muted">{ellipseAddress(w.address, 4)}</div>
                <div className="text-xs text-muted">{w.phone || '—'}</div>
                <div className="text-xs text-muted font-mono">{w.upiId || '—'}</div>
                <div className="text-center">
                  <span className="text-sm text-charcoal font-mono">{stars.toFixed(1)}</span>
                  <span className="text-xs text-terra ml-0.5">★</span>
                </div>
                <div className="text-center">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`} />
                    <span className={`text-xs font-display font-semibold ${statusInfo.textColor}`}>{statusInfo.label}</span>
                  </span>
                </div>
                <div className="text-right font-mono text-sm text-charcoal">
                  ${(w.totalEarned / 1_000_000).toFixed(2)}
                  {w.tasksCompleted > 0 && (
                    <div className="text-[10px] text-muted">{w.tasksCompleted} tasks</div>
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

export default WorkerList
