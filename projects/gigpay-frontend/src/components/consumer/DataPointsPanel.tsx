import React from 'react'

interface Field {
  name: string
  type: string
  desc: string
  replaces: string
  example: string
}

const FIELDS: Field[] = [
  {
    name: 'aura_score',
    type: 'uint16',
    desc: '1–1000 reference score. Same scale as CIBIL, computed open-source.',
    replaces: 'CIBIL Score',
    example: '712',
  },
  {
    name: 'verified_monthly_income',
    type: 'object',
    desc: 'Mean, median, 12-month variance, distinct payer count — from payment-proof attestations.',
    replaces: 'Salary slip',
    example: '{ mean: 14250, payers: 3 }',
  },
  {
    name: 'stability_index',
    type: 'uint8',
    desc: '0–100. Recency × diversification × tenure. One number for income reliability.',
    replaces: 'Form 16 / ITR',
    example: '78',
  },
  {
    name: 'trust_signals',
    type: 'object',
    desc: 'Distinct issuers, vouch count, revocation rate, verified-business issuer ratio.',
    replaces: 'Reference check',
    example: '{ issuers: 5, vouches: 2 }',
  },
  {
    name: 'attestations',
    type: 'array',
    desc: 'Raw on-chain records, consent-gated. For deep due-diligence on flagged cases.',
    replaces: 'Employment letter',
    example: 'cat=1 (work_event) × 12',
  },
]

const DataPointsPanel: React.FC = () => {
  return (
    <div className="nb-card bg-white rounded-2xl p-6 md:p-8 shadow-brutal">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <span className="nb-tag bg-cream text-charcoal/60 border-charcoal/15 text-[11px] mb-2">The API surface</span>
          <h3 className="font-display text-xl md:text-2xl font-bold text-charcoal mt-1">Five decision-ready fields.</h3>
          <p className="text-charcoal/50 text-sm mt-1 max-w-2xl">
            One API call, one JSON response. Every field replaces a traditional document gig workers can't produce.
          </p>
        </div>
        <span className="nb-tag bg-cream text-charcoal/50 border-charcoal/15 font-mono text-[11px]">GET /v1/score</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {FIELDS.map((f) => (
          <div key={f.name} className="border-[1.5px] border-charcoal/10 rounded-xl bg-cream/30 p-4">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="font-mono text-sm text-terra font-bold">{f.name}</div>
              <span className="nb-tag bg-cream text-charcoal/55 border-charcoal/15 font-mono text-[11px]">{f.type}</span>
            </div>
            <div className="text-[12px] text-charcoal/55 leading-relaxed mb-3">{f.desc}</div>
            <div className="pt-3 border-t border-dashed border-charcoal/10 flex items-center justify-between gap-3">
              <div className="font-mono text-[12px] text-charcoal/45">
                replaces: <span className="text-terra font-semibold">{f.replaces}</span>
              </div>
              <div className="font-mono text-[12px] text-charcoal/55 truncate">{f.example}</div>
            </div>
          </div>
        ))}

        {/* Sample response card */}
        <div className="nb-card bg-charcoal text-cream rounded-xl p-4 shadow-brutal-terra relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-terra rounded-t-xl" />
          <div className="pt-1 flex items-start justify-between mb-3">
            <span className="font-mono text-[11px] tracking-[0.08em] uppercase text-cream/50">Sample Response</span>
            <span className="font-mono text-[12px] bg-cream/10 text-cream/70 px-2 py-0.5 rounded-md border border-cream/15">
              200 OK
            </span>
          </div>
          <pre className="font-mono text-[12px] text-cream/75 leading-relaxed overflow-x-auto whitespace-pre">{`{
  "address": "XXTW...IGFU",
  "aura_score": 712,
  "band": "Very Good",
  "verified_monthly_income": {
    "mean": 14250,
    "median": 14100,
    "variance": 0.08,
    "distinct_payers": 3
  },
  "stability_index": 78,
  "trust_signals": {
    "issuers": 5,
    "vouches": 2,
    "revocation_rate": 0.0
  },
  "tenure_months": 14,
  "consent": {
    "granted_at": 1747300000,
    "expires_at": 1755000000,
    "scope": "all"
  }
}`}</pre>
        </div>
      </div>
    </div>
  )
}

export default DataPointsPanel
