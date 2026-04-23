import React from 'react'
import { WorkerProfile as WorkerProfileData } from '../../hooks/useWorkerData'
import { ellipseAddress } from '../../utils/ellipseAddress'

interface WorkerProfileProps {
  profile: WorkerProfileData
}

const STATUS_MAP: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: 'Inactive', color: 'text-muted', bg: 'bg-cream' },
  1: { label: 'Active', color: 'text-sage', bg: 'bg-sage-light' },
  2: { label: 'Suspended', color: 'text-terra', bg: 'bg-terra-light' },
}

const WorkerProfileCard: React.FC<WorkerProfileProps> = ({ profile }) => {
  const statusInfo = STATUS_MAP[profile.status] || STATUS_MAP[0]
  const stars = (profile.rating / 10).toFixed(1)

  return (
    <div className="nb-dash-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="nb-section-heading">My Profile</h2>
        <span className={`nb-tag ${statusInfo.bg} ${statusInfo.color}`}>{statusInfo.label}</span>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg border-2 border-charcoal bg-terra-light flex items-center justify-center shadow-brutal-sm">
            <span className="font-display text-lg font-bold text-terra">
              {profile.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="text-lg text-charcoal font-display font-bold">{profile.name}</div>
            <div className="text-xs text-muted font-mono">{ellipseAddress(profile.address, 8)}</div>
          </div>
        </div>

        <div className="border-t-2 border-charcoal/10 pt-4 grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-1">Phone</div>
            <div className="text-sm text-charcoal">{profile.phone || '—'}</div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-1">UPI / Bank</div>
            <div className="text-sm text-charcoal font-mono">{profile.upiId || '—'}</div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-1">Rating</div>
            <div className="text-sm text-charcoal font-mono">
              {stars} <span className="text-terra">★</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-1">Registered</div>
            <div className="text-sm text-charcoal">
              {profile.registeredAt > 0
                ? new Date(profile.registeredAt * 1000).toLocaleDateString()
                : '—'}
            </div>
          </div>
        </div>

        <div className="border-t-2 border-charcoal/10 pt-4">
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-1">Wallet Address</div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted break-all leading-relaxed">{profile.address}</span>
            <button
              className="nb-btn-ghost !text-[10px] !py-0.5 !px-2"
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
