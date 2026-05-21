import React from 'react'

interface Tier {
  name: string
  price: string
  unit: string
  best: string
  features: string[]
  accent: string
  shadow: string
  highlight?: boolean
}

const TIERS: Tier[] = [
  {
    name: 'Pilot',
    price: 'Free',
    unit: '100 queries / mo',
    best: 'Internal evaluation, proof-of-concept',
    features: ['100 worker lookups', 'Aura Score + summaries', 'Email support', 'No SLA'],
    accent: 'bg-sage',
    shadow: 'shadow-brutal-sage',
  },
  {
    name: 'Growth',
    price: '₹20',
    unit: 'per query',
    best: 'Production underwriting at scale',
    features: ['Unlimited queries', 'Full data point set', 'Raw attestation feed', 'Webhook events', '99.9% uptime SLA'],
    accent: 'bg-terra',
    shadow: 'shadow-brutal-terra',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '₹2L+',
    unit: 'per month',
    best: 'High-volume + custom risk models',
    features: ['Dedicated support', 'Bulk batch endpoints', 'Custom scoring webhooks', '99.99% uptime SLA', 'On-prem option'],
    accent: 'bg-lavender',
    shadow: 'shadow-brutal-lavender',
  },
]

const PricingPanel: React.FC = () => {
  return (
    <div className="nb-card bg-white rounded-2xl p-6 md:p-8 shadow-brutal">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <span className="nb-tag bg-cream text-charcoal/60 border-charcoal/15 text-[9px] mb-2">Pricing</span>
          <h3 className="font-display text-xl md:text-2xl font-bold text-charcoal mt-1">
            Pay per query.{' '}
            <span className="font-serif italic text-terra font-normal">No take-rate.</span>
          </h3>
          <p className="text-charcoal/50 text-sm mt-1 max-w-2xl">
            We charge for the data lookup, not a share of the loan. Keeps us a clean bureau, keeps you with 100% of the spread,
            keeps both of us out of financial-operator regulation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`nb-card bg-white rounded-2xl p-5 ${t.shadow} relative overflow-hidden ${
              t.highlight ? 'md:scale-[1.02] md:-translate-y-1' : ''
            }`}
          >
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${t.accent} rounded-t-2xl`} />
            <div className="pt-2 mb-4 flex items-start justify-between">
              <span className="nb-tag bg-cream text-charcoal/60 border-charcoal/15 font-mono text-[9px]">{t.name}</span>
              {t.highlight && (
                <span className="nb-tag bg-terra text-cream border-terra font-mono text-[9px]">Recommended</span>
              )}
            </div>
            <div className="mb-2">
              <span className="font-display text-3xl font-extrabold text-charcoal">{t.price}</span>
              <span className="font-mono text-[10px] text-charcoal/40 ml-1.5">{t.unit}</span>
            </div>
            <div className="text-[11px] text-charcoal/55 mb-4 leading-relaxed">{t.best}</div>
            <ul className="space-y-1.5 pt-3 border-t-[1.5px] border-dashed border-charcoal/10">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[12px] text-charcoal/65 leading-snug">
                  <span className={`w-1.5 h-1.5 ${t.accent} rounded-full border border-charcoal/40 mt-1.5 shrink-0`} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t-[1.5px] border-dashed border-charcoal/15 flex flex-col md:flex-row md:items-center justify-between gap-3 text-[11px] font-mono text-charcoal/45">
        <span>All tiers: DPDP-compliant · per-worker consent enforced on every read</span>
        <a
          href="mailto:partners@alora.id"
          className="font-display font-bold text-terra hover:text-terra-dark transition-colors tracking-widest uppercase"
        >
          Talk to us →
        </a>
      </div>
    </div>
  )
}

export default PricingPanel
