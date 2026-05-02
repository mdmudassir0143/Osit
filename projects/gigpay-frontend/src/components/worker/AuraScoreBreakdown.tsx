import React from 'react'
import { ScoreBreakdown } from '../../services/score'

interface Props {
  breakdown: ScoreBreakdown
}

interface Row {
  label: string
  desc: string
  value: number
  max: number
  min?: number
  accent: string
}

const buildRows = (b: ScoreBreakdown): Row[] => [
  {
    label: 'Base',
    desc: 'Everyone starts at 300. Earn the rest.',
    value: b.components.base,
    max: 300,
    accent: 'bg-charcoal/30',
  },
  {
    label: 'Volume',
    desc: 'Number of active attestations (logarithmic — diminishing returns).',
    value: b.components.volume,
    max: 200,
    accent: 'bg-sage',
  },
  {
    label: 'Diversity',
    desc: 'Distinct categories: Work / Skill / Payment / Vouch / Other.',
    value: b.components.diversity,
    max: 100,
    accent: 'bg-sun',
  },
  {
    label: 'Issuer breadth',
    desc: 'Distinct employers, clients, and trainers vouching for you.',
    value: b.components.issuerBreadth,
    max: 150,
    accent: 'bg-terra',
  },
  {
    label: 'Average rating',
    desc: 'Mean issuer-suggested rating across active attestations.',
    value: b.components.rating,
    max: 100,
    accent: 'bg-lavender',
  },
  {
    label: 'Tenure',
    desc: 'Years since your earliest attestation (or registration if none yet).',
    value: b.components.tenure,
    max: 80,
    accent: 'bg-sage',
  },
  {
    label: 'Recency',
    desc: '+50 if attested in last 30d, decays to −50 after a year.',
    value: b.components.recency,
    max: 50,
    min: -50,
    accent: 'bg-sun',
  },
  {
    label: 'Vouch + Payment bonus',
    desc: 'Peer vouches and payment proofs are high-trust signals.',
    value: b.components.bonus,
    max: 60,
    accent: 'bg-terra',
  },
  {
    label: 'Revocation penalty',
    desc: 'Revoked attestations dent the score — proportional to ratio.',
    value: b.components.revocationPenalty,
    max: 0,
    min: -100,
    accent: 'bg-terra',
  },
]

const Bar: React.FC<{ row: Row }> = ({ row }) => {
  const isNegative = row.value < 0
  // For positive components, fill % of max. For penalty rows, show
  // how much of the *worst case* has been incurred (mirrored bar).
  const widthPct = isNegative
    ? Math.min(100, (Math.abs(row.value) / Math.abs(row.min ?? -100)) * 100)
    : row.max > 0
    ? Math.min(100, (row.value / row.max) * 100)
    : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <div className="font-display text-sm font-bold text-charcoal">{row.label}</div>
          <div className="text-[11px] text-charcoal/45 leading-snug">{row.desc}</div>
        </div>
        <div
          className={`font-mono text-sm font-extrabold tabular-nums shrink-0 ml-3 ${
            isNegative ? 'text-terra' : 'text-charcoal'
          }`}
        >
          {row.value > 0 ? '+' : ''}
          {row.value}
        </div>
      </div>
      <div className="relative h-2.5 bg-charcoal/[0.06] rounded-full border-[1.5px] border-charcoal/10 overflow-hidden">
        <div
          className={`absolute top-0 ${isNegative ? 'right-0' : 'left-0'} h-full ${isNegative ? 'bg-terra' : row.accent} transition-all duration-700`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  )
}

const AuraScoreBreakdown: React.FC<Props> = ({ breakdown }) => {
  const rows = buildRows(breakdown)

  return (
    <div className="nb-card bg-white rounded-2xl p-6 md:p-8 shadow-brutal">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <span className="nb-tag bg-cream text-charcoal/60 border-charcoal/15 text-[9px] mb-2">Score Breakdown</span>
          <h3 className="font-display text-xl font-bold text-charcoal mt-1">How your Aura Score is built</h3>
          <p className="text-charcoal/50 text-sm mt-1 max-w-2xl">
            The protocol stays neutral — anyone can recompute this from raw on-chain data. This is Alora's reference formula,
            published openly so workers and consumers see exactly what moves the number.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-charcoal/35 mb-1">Total</div>
          <div className="font-display text-3xl font-extrabold text-charcoal leading-none">{breakdown.total}</div>
          <div className="font-mono text-[10px] text-charcoal/45 mt-1">/ 1000</div>
        </div>
      </div>

      <div className="space-y-4">
        {rows.map((row) => (
          <Bar key={row.label} row={row} />
        ))}
      </div>

      {/* Hints panel */}
      <div className="mt-6 pt-5 border-t-[2px] border-dashed border-charcoal/15">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 bg-terra rounded-full border-2 border-charcoal" />
          <span className="font-display text-sm font-bold text-charcoal uppercase tracking-wide">How to push it higher</span>
        </div>
        <ul className="space-y-2">
          {breakdown.hints.map((hint, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-charcoal/65 leading-relaxed">
              <span className="font-mono text-[10px] text-terra font-bold tabular-nums mt-0.5">{(i + 1).toString().padStart(2, '0')}</span>
              <span>{hint}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bands legend */}
      <div className="mt-5 pt-4 border-t-[1.5px] border-dashed border-charcoal/10">
        <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-charcoal/35 mb-2">Bands</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[
            { range: '1–300', label: 'Building', color: 'bg-terra', text: 'text-terra' },
            { range: '301–550', label: 'Fair', color: 'bg-sun', text: 'text-charcoal' },
            { range: '551–700', label: 'Good', color: 'bg-sage', text: 'text-sage' },
            { range: '701–850', label: 'Very Good', color: 'bg-lavender', text: 'text-charcoal' },
            { range: '851–1000', label: 'Excellent', color: 'bg-cream', text: 'text-charcoal' },
          ].map((b) => (
            <div
              key={b.range}
              className={`border-[1.5px] rounded-md px-2 py-1.5 ${
                b.label === breakdown.band ? 'border-charcoal' : 'border-charcoal/10'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`w-2 h-2 ${b.color} rounded-full border border-charcoal/40`} />
                <span className={`font-mono text-[10px] font-bold ${b.text}`}>{b.label}</span>
              </div>
              <div className="font-mono text-[10px] text-charcoal/40">{b.range}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AuraScoreBreakdown
