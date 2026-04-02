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
    <div className="bg-surface-raised border border-border rounded-lg p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl text-charcoal">Registered Workers</h2>
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted">
          {workers.length} {workers.length === 1 ? 'worker' : 'workers'}
        </span>
      </div>

      {workers.length === 0 ? (
        <div className="py-10 text-center">
          <div className="text-muted text-sm">No workers registered yet</div>
        </div>
      ) : (
        <div className="space-y-0">
          <div className="grid grid-cols-7 gap-3 pb-3 border-b border-border text-[10px] tracking-[0.2em] uppercase text-muted">
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
                className="grid grid-cols-7 gap-3 py-3.5 border-b border-border-light items-center hover:bg-surface transition-colors -mx-2 px-2 rounded"
              >
                <div className="text-sm text-charcoal font-medium">{w.name || '—'}</div>
                <div className="font-mono text-xs text-muted">{ellipseAddress(w.address, 4)}</div>
                <div className="text-xs text-muted">{w.phone || '—'}</div>
                <div className="text-xs text-muted font-mono">{w.upiId || '—'}</div>
                <div className="text-center">
                  <span className="text-sm text-charcoal">{stars.toFixed(1)}</span>
                  <span className="text-xs text-terra ml-0.5">★</span>
                </div>
                <div className="text-center">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
                    <span className={`text-xs ${statusInfo.textColor}`}>{statusInfo.label}</span>
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
