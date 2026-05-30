import React from 'react'

interface Lift {
  before: string
  after: string
  delta: string
}

const LIFTS: Lift[] = [
  {
    before: 'Loan rejected — no salary slip',
    after: 'Loan approved in 8 seconds via Aura Score',
    delta: 'From rejected to ₹50K',
  },
  {
    before: 'Interest rate 24% (informal-worker premium)',
    after: 'Interest rate 12% (verified record)',
    delta: '₹6,000 saved per ₹50K loan',
  },
  {
    before: 'Rent deposit ₹30,000 demanded',
    after: 'Deposit waived on verified income',
    delta: '₹30K freed up',
  },
  {
    before: 'EPFO contributions invisible across jobs',
    after: 'Portable record stitched on-chain',
    delta: 'Retirement actually accrues',
  },
  {
    before: 'Insurance premium loaded for "informal" risk',
    after: 'Standard premium with verified history',
    delta: '20-30% premium savings',
  },
  {
    before: 'Reputation resets every employer',
    after: 'Score follows the worker, not the job',
    delta: 'Mobility unlocked',
  },
]

const WorkerEmpowerment: React.FC = () => {
  return (
    <div className="nb-card bg-white rounded-2xl p-6 md:p-8 shadow-brutal-sage">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <span className="nb-tag bg-sage-light text-sage border-sage/40 text-[11px] mb-2">Why this matters</span>
          <h3 className="font-serif text-2xl md:text-3xl font-normal text-charcoal tracking-[-0.01em] mt-1">
            What querying Alora{' '}
            <span className="font-serif italic text-terra font-normal">unlocks for the worker.</span>
          </h3>
          <p className="text-charcoal/50 text-sm mt-1 max-w-2xl">
            Consumers query the bureau. Workers get formal-economy access. Every NBFC call against a worker's record is also a
            step out of the informal-economy interest premium.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {LIFTS.map((lift, i) => (
          <div key={i} className="border-[1.5px] border-charcoal/10 rounded-xl bg-cream/30 p-4">
            <div className="flex items-start gap-3">
              <div className="font-mono text-[11px] tracking-[0.08em] uppercase text-charcoal/35 shrink-0 mt-0.5">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="flex-1">
                <div className="flex items-start gap-2">
                  <span className="font-mono text-[12px] text-terra font-bold mt-0.5 shrink-0">×</span>
                  <span className="text-[12px] text-charcoal/55 leading-snug">{lift.before}</span>
                </div>
                <div className="flex items-start gap-2 mt-1">
                  <span className="font-mono text-[12px] text-sage font-bold mt-0.5 shrink-0">→</span>
                  <span className="text-[12px] text-charcoal/85 font-semibold leading-snug">{lift.after}</span>
                </div>
                <div className="mt-2 inline-block bg-sage-light text-sage border-[1.5px] border-sage/30 px-2 py-0.5 rounded-md text-[12px] font-mono font-semibold">
                  {lift.delta}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t-[1.5px] border-dashed border-charcoal/15 text-[12px] text-charcoal/45 leading-relaxed">
        Worker outcomes shown are reference scenarios based on typical informal-worker vs. CIBIL-prime spreads in Indian
        consumer-lending markets. Actual outcomes depend on each NBFC's underwriting policy.
      </div>
    </div>
  )
}

export default WorkerEmpowerment
