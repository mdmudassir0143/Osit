import React from 'react'
import { WorkerProfile as WorkerProfileData } from '../../hooks/useWorkerData'
import { ellipseAddress } from '../../utils/ellipseAddress'

interface WorkerProfileProps {
  profile: WorkerProfileData
}

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: 'Inactive', color: 'text-muted' },
  1: { label: 'Active', color: 'text-sage' },
  2: { label: 'Suspended', color: 'text-terra' },
}

const WorkerProfileCard: React.FC<WorkerProfileProps> = ({ profile }) => {
  const statusInfo = STATUS_MAP[profile.status] || STATUS_MAP[0]
  const stars = (profile.rating / 10).toFixed(1)

  return (
    <div className="bg-surface-raised border border-border rounded-lg p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl text-charcoal">My Profile</h2>
        <span className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-terra-light flex items-center justify-center">
            <span className="font-serif text-lg text-terra">
              {profile.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="text-lg text-charcoal font-medium">{profile.name}</div>
            <div className="text-xs text-muted font-mono">{ellipseAddress(profile.address, 8)}</div>
          </div>
        </div>

        <div className="border-t border-border-light pt-4 grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-1">Phone</div>
            <div className="text-sm text-charcoal">{profile.phone || '—'}</div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-1">UPI / Bank</div>
            <div className="text-sm text-charcoal font-mono">{profile.upiId || '—'}</div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-1">Rating</div>
            <div className="text-sm text-charcoal">
              {stars} <span className="text-terra">★</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-1">Registered</div>
            <div className="text-sm text-charcoal">
              {profile.registeredAt > 0
                ? new Date(profile.registeredAt * 1000).toLocaleDateString()
                : '—'}
            </div>
          </div>
        </div>

        <div className="border-t border-border-light pt-4">
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-1">Wallet Address</div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted break-all leading-relaxed">{profile.address}</span>
            <button
              className="text-[10px] tracking-wider uppercase text-terra hover:text-terra-dark transition-colors flex-shrink-0 border border-terra/30 px-2 py-0.5 rounded"
              onClick={() => navigator.clipboard.writeText(profile.address)}
            >
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkerProfileCard
