import React from 'react'
import { AttestationRecord, CATEGORY_LABELS } from '../../services/attestations'
import { WorkerProfile } from '../../services/registry'
import { computeAuraScore } from '../../services/score'

interface Props {
  address: string
  profile: WorkerProfile
  attestations: AttestationRecord[]
}

const truncate = (s: string, head = 6, tail = 4) =>
  s.length > head + tail + 3 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s

const categoryAccent: Record<number, string> = {
  1: 'bg-sage',
  2: 'bg-sun',
  3: 'bg-terra',
  4: 'bg-lavender',
  5: 'bg-cream',
}

// Hex equivalents of the brutalist palette tokens, for SVG strokes.
const bandHex: Record<string, string> = {
  terra: '#c44b2b',
  sun: '#f4c542',
  sage: '#4f7a4d',
  lavender: '#a99bd4',
  cream: '#fef9ec',
}

const AuraCard: React.FC<Props> = ({ address, profile, attestations }) => {
  const nowSec = BigInt(Math.floor(Date.now() / 1000))
  const score = computeAuraScore(attestations, profile.registeredAt)

  const yearsLabel =
    score.yearsActive < 1 / 12
      ? 'New'
      : score.yearsActive < 1
      ? `${Math.max(1, Math.round(score.yearsActive * 12))} mo`
      : `${score.yearsActive.toFixed(1)} yr`

  const active = attestations.filter(
    (a) => !a.revoked && (a.validUntil === 0n || a.validUntil > nowSec),
  )
  const byCategory = new Map<number, number>()
  for (const a of active) byCategory.set(a.category, (byCategory.get(a.category) ?? 0) + 1)
  const skills = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // SVG arc gauge — score progress along a 270° arc.
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const arcFraction = 0.75 // 270°
  const arcLength = circumference * arcFraction
  const progress = score.total / 1000
  const filled = arcLength * progress
  const strokeColor = bandHex[score.bandColor]

  return (
    <div className="nb-card bg-charcoal text-cream rounded-2xl p-6 md:p-8 shadow-brutal-lg relative overflow-hidden">
      {/* Top accent stripe — color matches band */}
      <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: strokeColor }} />
      {/* Subtle grid dots */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #fef9ec 1px, transparent 1px)',
          backgroundSize: '14px 14px',
        }}
      />

      {/* Header row */}
      <div className="relative flex items-start justify-between gap-6 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-cream/50">Aura Card</span>
            <span className="w-1 h-1 bg-terra rounded-full" />
            <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-cream/50">Alora</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold leading-none mb-2">@{profile.handle}</h2>
          <div className="font-mono text-[11px] text-cream/40">{truncate(address, 8, 6)}</div>
        </div>

        {/* Circular score gauge */}
        <div className="relative w-44 h-44 shrink-0">
          <svg width="176" height="176" viewBox="0 0 176 176" className="absolute inset-0">
            {/* Background arc */}
            <circle
              cx="88"
              cy="88"
              r={radius}
              fill="none"
              stroke="#fef9ec"
              strokeOpacity="0.1"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${arcLength} ${circumference}`}
              transform="rotate(135 88 88)"
            />
            {/* Filled arc */}
            <circle
              cx="88"
              cy="88"
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circumference}`}
              transform="rotate(135 88 88)"
              style={{ transition: 'stroke-dasharray 800ms ease-out' }}
            />
            {/* Tick marks at band thresholds */}
            {[300, 550, 700, 850].map((t) => {
              const a = 135 + 270 * (t / 1000)
              const rad = (a * Math.PI) / 180
              const x1 = 88 + Math.cos(rad) * (radius - 8)
              const y1 = 88 + Math.sin(rad) * (radius - 8)
              const x2 = 88 + Math.cos(rad) * (radius + 8)
              const y2 = 88 + Math.sin(rad) * (radius + 8)
              return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fef9ec" strokeOpacity="0.18" strokeWidth="1" />
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-cream/45 mb-1">Aura Score</div>
            <div className="font-display text-5xl font-extrabold leading-none" style={{ color: strokeColor }}>
              {score.total}
            </div>
            <div className="font-display text-[11px] font-bold tracking-wider uppercase mt-1" style={{ color: strokeColor }}>
              {score.band}
            </div>
            <div className="font-mono text-[9px] text-cream/35 mt-1">/ 1000</div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="relative grid grid-cols-4 gap-3 mb-6">
        <div className="bg-cream/[0.06] border-[1.5px] border-cream/10 rounded-lg p-3">
          <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-cream/45 mb-1">Experience</div>
          <div className="font-display text-xl font-extrabold">{yearsLabel}</div>
        </div>
        <div className="bg-cream/[0.06] border-[1.5px] border-cream/10 rounded-lg p-3">
          <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-cream/45 mb-1">Active</div>
          <div className="font-display text-xl font-extrabold">{score.activeCount}</div>
        </div>
        <div className="bg-cream/[0.06] border-[1.5px] border-cream/10 rounded-lg p-3">
          <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-cream/45 mb-1">Issuers</div>
          <div className="font-display text-xl font-extrabold">{score.distinctIssuers}</div>
        </div>
        <div className="bg-cream/[0.06] border-[1.5px] border-cream/10 rounded-lg p-3">
          <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-cream/45 mb-1">Skill Areas</div>
          <div className="font-display text-xl font-extrabold">{score.distinctCategories}</div>
        </div>
      </div>

      {/* Skills row */}
      <div className="relative">
        <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-cream/45 mb-3">Skill Set</div>
        {skills.length === 0 ? (
          <div className="text-cream/40 text-xs italic">Skills appear here as employers and clients attest to your work.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-2 bg-cream/[0.08] border-[1.5px] border-cream/15 rounded-md px-3 py-1.5">
                <span className={`w-2 h-2 ${categoryAccent[cat]} rounded-full border border-charcoal/40`} />
                <span className="font-mono text-[11px] text-cream/85 font-semibold">{CATEGORY_LABELS[cat]}</span>
                <span className="font-mono text-[10px] text-cream/45">×{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative mt-6 pt-4 border-t-[1.5px] border-cream/10 flex items-center justify-between text-[10px] font-mono text-cream/35">
        <span>Portable · On-chain · Worker-owned</span>
        <span>alora.id</span>
      </div>
    </div>
  )
}

export default AuraCard
