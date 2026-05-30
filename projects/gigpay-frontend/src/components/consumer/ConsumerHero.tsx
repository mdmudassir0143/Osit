import React from 'react'

interface Props {
  address: string
}

const truncate = (s: string, head = 6, tail = 4) =>
  s.length > head + tail + 3 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s

const ConsumerHero: React.FC<Props> = ({ address }) => {
  return (
    <div className="nb-card bg-charcoal text-cream rounded-2xl p-6 md:p-10 shadow-brutal-lg relative overflow-hidden">
      {/* Top accent stripe */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-terra" />
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #fef9ec 1px, transparent 1px)',
          backgroundSize: '14px 14px',
        }}
      />

      <div className="relative grid md:grid-cols-2 gap-6 items-center">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-[12px] tracking-[0.1em] uppercase text-cream/50">Consumer · Bureau API</span>
            <span className="w-1 h-1 bg-terra rounded-full" />
            <span className="font-mono text-[12px] tracking-[0.1em] uppercase text-cream/50">Alora</span>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-normal leading-tight tracking-[-0.01em] mb-3">
            Underwrite the next{' '}
            <span className="text-terra italic font-serif font-normal">300 million.</span>
          </h2>
          <p className="text-cream/55 text-sm md:text-base leading-relaxed">
            You're querying verified, on-chain work history for workers without CIBIL, salary slips, or ITRs. Every record is
            cryptographically signed by a real employer or client. Workers grant access per-consumer; we never share data without
            their consent.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Decision Time', value: '<3s', sub: 'API to underwriting' },
            { label: 'Underwriting Cost', value: '95% ↓', sub: 'vs. manual review' },
            { label: 'TAM Unlocked', value: '300M+', sub: 'Indian gig workers' },
            { label: 'Data Freshness', value: 'Real-time', sub: 'On-chain reads' },
          ].map((s) => (
            <div key={s.label} className="bg-cream/[0.06] border-[1.5px] border-cream/10 rounded-lg p-3">
              <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-cream/45 mb-1">{s.label}</div>
              <div className="font-display text-2xl font-extrabold leading-none text-cream">{s.value}</div>
              <div className="font-mono text-[12px] text-cream/40 mt-1">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-6 pt-5 border-t-[1.5px] border-cream/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-[12px] font-mono">
        <div className="text-cream/45">
          Consumer wallet: <span className="text-cream/85">{truncate(address, 8, 6)}</span>
        </div>
        <div className="text-cream/35">
          V1: direct on-chain reads · Phase 5: gateway with subscription tier
        </div>
      </div>
    </div>
  )
}

export default ConsumerHero
