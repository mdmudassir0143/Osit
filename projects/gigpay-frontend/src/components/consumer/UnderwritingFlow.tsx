import React from 'react'

interface Step {
  num: string
  title: string
  detail: string
  accent: string
  shadow: string
}

const STEPS: Step[] = [
  {
    num: '01',
    title: 'Worker grants access',
    detail:
      "Consumer sends a grant request (worker's phone or wallet). Worker reviews scope, expiry, query limit. Signs once. On-chain record of consent.",
    accent: 'bg-sage',
    shadow: 'shadow-brutal-sage',
  },
  {
    num: '02',
    title: 'Query the API',
    detail:
      'GET /v1/workers/{address}/score → returns Aura Score, verified monthly income, stability index, trust signals. Sub-3-second response, consent-verified on-chain per call.',
    accent: 'bg-sun',
    shadow: 'shadow-brutal-sun',
  },
  {
    num: '03',
    title: 'Decide & fund',
    detail:
      'Plug the score into your existing underwriting rules. Approve, decline, or refer for review. If approved, disburse via your existing rails — Alora never touches the money.',
    accent: 'bg-terra',
    shadow: 'shadow-brutal-terra',
  },
  {
    num: '04',
    title: 'Worker repays · score updates',
    detail:
      'On repayment, optionally issue a "payment_proof" attestation back to the worker. Their Aura Score improves. Next consumer underwrites at a better rate. The flywheel turns.',
    accent: 'bg-lavender',
    shadow: 'shadow-brutal-lavender',
  },
]

const UnderwritingFlow: React.FC = () => {
  return (
    <div className="nb-card bg-white rounded-2xl p-6 md:p-8 shadow-brutal">
      <div className="mb-6">
        <span className="nb-tag bg-cream text-charcoal/60 border-charcoal/15 text-[9px] mb-2">Underwriting Flow</span>
        <h3 className="font-display text-xl md:text-2xl font-bold text-charcoal mt-1">
          From grant to disbursement in four steps.
        </h3>
        <p className="text-charcoal/50 text-sm mt-1 max-w-2xl">
          The same model CIBIL-driven underwriting uses today — just with a different bureau under the hood, and a worker who
          actually owns their record.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {STEPS.map((s, i) => (
          <div key={s.num} className="relative">
            <div className={`nb-card bg-white rounded-xl p-5 ${s.shadow} h-full relative overflow-hidden`}>
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${s.accent} rounded-t-xl`} />
              <div className="pt-1 mb-3">
                <span className={`w-10 h-10 ${s.accent} rounded-lg border-2 border-charcoal flex items-center justify-center font-mono text-sm font-bold text-charcoal`}>
                  {s.num}
                </span>
              </div>
              <h4 className="font-display text-base font-bold text-charcoal mb-2">{s.title}</h4>
              <p className="text-charcoal/55 text-[12px] leading-relaxed">{s.detail}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-6 h-6 bg-cream border-2 border-charcoal/15 rounded-full items-center justify-center">
                <span className="text-terra text-xs font-bold">&rarr;</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default UnderwritingFlow
