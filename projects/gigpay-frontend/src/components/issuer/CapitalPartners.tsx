import React from 'react'

interface Partner {
  key: string
  name: string
  tagline: string
  products: string[]
  threshold: string
  accent: string
  shadow: string
}

const PARTNERS: Partner[] = [
  {
    key: 'kreditbee',
    name: 'KreditBee Gig',
    tagline: 'Personal loans up to ₹4L for verified gig workers',
    products: ['Salary advance', 'Personal loan', 'Bill financing'],
    threshold: '6+ months Aura, 4.0+ avg rating',
    accent: 'bg-terra',
    shadow: 'shadow-brutal-terra',
  },
  {
    key: 'capitalfloat',
    name: 'Capital Float',
    tagline: 'Salary advance up to 50% of monthly earnings',
    products: ['Pay-day advance', 'BNPL'],
    threshold: '3+ payment-proof attestations',
    accent: 'bg-sage',
    shadow: 'shadow-brutal-sage',
  },
  {
    key: 'freo',
    name: 'Freo (MoneyTap)',
    tagline: 'Line of credit, draw what you need',
    products: ['Credit line', 'Insurance bundle'],
    threshold: '12+ active attestations across 2+ employers',
    accent: 'bg-sun',
    shadow: 'shadow-brutal-sun',
  },
  {
    key: 'lendingkart',
    name: 'Lendingkart',
    tagline: 'Working-capital and equipment finance',
    products: ['Equipment loan', 'Working capital'],
    threshold: '1+ year Aura, vouched by employer',
    accent: 'bg-lavender',
    shadow: 'shadow-brutal-lavender',
  },
]

const CapitalPartners: React.FC = () => {
  const handleConnect = (partner: Partner) => {
    // Phase 5+ swap target: real partner integration via the read-API gateway.
    // V1 demo: surface what the integration would look like.
    alert(
      `Demo: ${partner.name}\n\nIn production, this opens a partner-hosted page that pulls the worker's Alora record (with their consent) and underwrites in seconds.\n\nAlora never holds the loan — the partner does. We provide the verifiable work history.`,
    )
  }

  return (
    <div className="nb-card bg-charcoal text-cream rounded-2xl p-6 md:p-8 shadow-brutal-lg relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #fef9ec 1px, transparent 1px)',
          backgroundSize: '14px 14px',
        }}
      />

      <div className="relative flex items-start justify-between mb-6 gap-4">
        <div>
          <span className="nb-tag bg-cream/10 text-cream/65 border-cream/15 text-[11px] mb-2">Capital Partners</span>
          <h3 className="font-display text-xl font-bold mt-1">Connect workers to credit</h3>
          <p className="text-cream/50 text-sm mt-1 max-w-2xl">
            Refer workers to NBFCs and lenders that underwrite using Alora records. Partner pulls the on-chain history with the
            worker's consent, makes a decision in seconds. <span className="text-terra font-semibold">Alora doesn't lend.</span>{' '}
            We surface partners.
          </p>
        </div>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4">
        {PARTNERS.map((p) => (
          <div
            key={p.key}
            className={`nb-card bg-white text-charcoal rounded-xl p-5 ${p.shadow} relative overflow-hidden`}
          >
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${p.accent} rounded-t-xl`} />
            <div className="flex items-start justify-between mb-3 pt-1">
              <div className={`w-9 h-9 ${p.accent} rounded-lg border border-charcoal/15 flex items-center justify-center`}>
                <span className="text-charcoal text-sm font-display font-extrabold">{p.name.slice(0, 1)}</span>
              </div>
              <span className="nb-tag bg-cream text-charcoal/60 border-charcoal/15 text-[11px]">Partner</span>
            </div>
            <h4 className="font-display text-base font-bold mb-1">{p.name}</h4>
            <p className="text-charcoal/55 text-xs leading-relaxed mb-3">{p.tagline}</p>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {p.products.map((prod) => (
                <span
                  key={prod}
                  className="font-mono text-[12px] bg-cream text-charcoal/65 px-2 py-0.5 rounded-md border-[1.5px] border-charcoal/10"
                >
                  {prod}
                </span>
              ))}
            </div>

            <div className="pt-3 border-t-[1.5px] border-dashed border-charcoal/10">
              <div className="font-mono text-[11px] tracking-[0.08em] uppercase text-charcoal/35 mb-0.5">Eligibility</div>
              <div className="font-mono text-[12px] text-charcoal/65 mb-3">{p.threshold}</div>
              <button
                onClick={() => handleConnect(p)}
                className="nb-btn bg-terra text-cream w-full px-3 py-2 text-[12px] font-display font-bold tracking-widest uppercase"
              >
                Refer Worker →
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-5 pt-4 border-t-[1.5px] border-cream/10 text-[12px] font-mono text-cream/40 leading-relaxed">
        Partner names shown for demo. Alora does not have formal partnerships at this stage. Real integrations land in Phase 5
        with the read-API gateway and consent-routing for partner queries.
      </div>
    </div>
  )
}

export default CapitalPartners
