import React from 'react'
import { WorkerProfile } from '../../services/registry'
import { bytesToHex } from '../../services/vault'

interface Props {
  address: string
  profile: WorkerProfile
}

const truncate = (s: string, head = 6, tail = 4) => (s.length > head + tail + 3 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s)

const WorkerProfileCard: React.FC<Props> = ({ address, profile }) => {
  const phoneFingerprint = bytesToHex(profile.phoneHash).slice(0, 16)
  const registeredDate = new Date(Number(profile.registeredAt) * 1000)

  return (
    <div className="nb-card bg-white rounded-2xl p-6 md:p-8 shadow-brutal-sage">
      <div className="flex items-start justify-between mb-5">
        <div>
          <span className="nb-tag bg-sage-light text-sage border-sage/30 text-[9px] mb-2">Worker Identity</span>
          <h2 className="font-display text-2xl font-extrabold text-charcoal mt-2">@{profile.handle}</h2>
        </div>
        <div className="w-10 h-10 bg-sage rounded-lg border-2 border-charcoal flex items-center justify-center">
          <span className="text-cream text-sm font-bold">W</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-cream rounded-lg p-3 border-[1.5px] border-charcoal/10">
          <div className="text-[9px] tracking-[0.2em] uppercase text-charcoal/40 font-display font-semibold mb-1">Wallet</div>
          <div className="font-mono text-xs text-charcoal break-all">{truncate(address, 8, 6)}</div>
        </div>
        <div className="bg-cream rounded-lg p-3 border-[1.5px] border-charcoal/10">
          <div className="text-[9px] tracking-[0.2em] uppercase text-charcoal/40 font-display font-semibold mb-1">Phone Fingerprint</div>
          <div className="font-mono text-xs text-charcoal/70 break-all">{phoneFingerprint}…</div>
        </div>
        <div className="bg-cream rounded-lg p-3 border-[1.5px] border-charcoal/10">
          <div className="text-[9px] tracking-[0.2em] uppercase text-charcoal/40 font-display font-semibold mb-1">Registered</div>
          <div className="font-mono text-xs text-charcoal">{registeredDate.toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  )
}

export default WorkerProfileCard
