import React from 'react'

interface Persona {
  tag: string
  who: string
  ask: string
  outcome: string
  accent: string
  shadow: string
}

const PERSONAS: Persona[] = [
  {
    tag: 'NBFC',
    who: 'Personal-loan underwriter',
    ask: '"Can I lend ₹50K to this delivery driver without a salary slip?"',
    outcome: 'Pulls Aura Score + verified monthly income. Auto-approves above threshold.',
    accent: 'bg-terra',
    shadow: 'shadow-brutal-terra',
  },
  {
    tag: 'Neo-bank',
    who: 'Account-opening team',
    ask: '"Is this gig worker eligible for our pay-day-advance product?"',
    outcome: 'Reads income stability index + tenure. Eligibility decided in seconds.',
    accent: 'bg-sage',
    shadow: 'shadow-brutal-sage',
  },
  {
    tag: 'Insurer',
    who: 'Health-insurance enrollment',
    ask: '"Does this worker qualify for our gig-worker policy at standard premium?"',
    outcome: 'Verifies sustained income + employer breadth. No medical underwriting tax for high-Aura workers.',
    accent: 'bg-sun',
    shadow: 'shadow-brutal-sun',
  },
  {
    tag: 'Employer',
    who: 'Hiring manager (next employer)',
    ask: '"Has this candidate actually done the work she lists?"',
    outcome: 'Reviews attestations from past employers. Confirms tenure, ratings, vouches.',
    accent: 'bg-lavender',
    shadow: 'shadow-brutal-lavender',
  },
  {
    tag: 'Landlord',
    who: 'Rental verification',
    ask: '"Can I trust this worker with a 6-month lease without 3-month deposit?"',
    outcome: 'Reads verified-income aggregates + payment-proof recency. Waives deposit on threshold.',
    accent: 'bg-cream',
    shadow: 'shadow-brutal',
  },
  {
    tag: 'Govt / Welfare',
    who: 'Scheme eligibility (PMSYM, e-Shram)',
    ask: '"Is this worker active in the informal economy this month?"',
    outcome: 'Reads recent attestation activity. Auto-enrolls eligible workers in welfare schemes.',
    accent: 'bg-charcoal',
    shadow: 'shadow-brutal',
  },
]

const UseCasePersonas: React.FC = () => {
  return (
    <div className="nb-card bg-white rounded-2xl p-6 md:p-8 shadow-brutal">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <span className="nb-tag bg-cream text-charcoal/60 border-charcoal/15 text-[9px] mb-2">Who uses this</span>
          <h3 className="font-display text-xl md:text-2xl font-bold text-charcoal mt-1">
            Six audiences. One bureau API.
          </h3>
          <p className="text-charcoal/50 text-sm mt-1 max-w-2xl">
            Every consumer asks a different question. Alora answers all of them with the same on-chain primitives — score,
            income, trust, attestations. Workers grant access per-consumer; revoke any time.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PERSONAS.map((p) => (
          <div key={p.tag} className={`nb-card bg-white rounded-xl p-5 ${p.shadow} relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${p.accent} rounded-t-xl`} />
            <div className="pt-2 mb-3">
              <span className="nb-tag bg-cream text-charcoal/60 border-charcoal/15 font-mono text-[9px]">{p.tag}</span>
            </div>
            <h4 className="font-display text-sm font-bold text-charcoal mb-2">{p.who}</h4>
            <div className="text-[13px] text-charcoal/70 italic leading-relaxed mb-3">{p.ask}</div>
            <div className="pt-3 border-t-2 border-dashed border-charcoal/10 text-[12px] text-charcoal/55 leading-relaxed">
              {p.outcome}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default UseCasePersonas
