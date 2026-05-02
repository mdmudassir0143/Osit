import React from 'react'
import { IssuePrefill } from './WorkforceRoster'

interface Props {
  workerCount: number
  onIssue: (prefill: IssuePrefill) => void
}

interface BenefitTile {
  key: string
  badge: string
  title: string
  desc: string
  amount: string
  cadence: string
  ctaLabel: string
  prefill: Omit<IssuePrefill, 'subject'>
  accent: string
  shadow: string
  ribbon: string
}

const BENEFITS: BenefitTile[] = [
  {
    key: 'epfo',
    badge: 'EPFO',
    title: "Provident Fund contribution",
    desc:
      'Record this month\'s 12% employer + 12% worker EPFO contribution as a Payment Proof attestation. Workers carry the record across employers — no UAN merger headache.',
    amount: '12% + 12%',
    cadence: 'Monthly',
    ctaLabel: 'Record EPFO',
    prefill: { category: 3, claim: 'EPFO contribution — UAN: <worker UAN>, period: <YYYY-MM>, employer share + employee share' },
    accent: 'bg-terra',
    shadow: 'shadow-brutal-terra',
    ribbon: 'bg-terra-light text-terra border-terra/40',
  },
  {
    key: 'esi',
    badge: 'ESI',
    title: 'Employee State Insurance',
    desc:
      'Record ESI contribution (3.25% employer + 0.75% worker) for medical, maternity, disability cover. Worker can present this to any future employer or insurer.',
    amount: '3.25% + 0.75%',
    cadence: 'Monthly',
    ctaLabel: 'Record ESI',
    prefill: { category: 3, claim: 'ESI contribution — IP number: <worker IP>, period: <YYYY-MM>' },
    accent: 'bg-sun',
    shadow: 'shadow-brutal-sun',
    ribbon: 'bg-sun-light text-charcoal border-sun/40',
  },
  {
    key: 'payroll',
    badge: 'Payroll',
    title: 'Salary disbursement',
    desc:
      'Attest to a payroll cycle — gross, net, days worked. Workers can use this as verifiable income proof when applying for credit, housing, or visas.',
    amount: '—',
    cadence: 'Per cycle',
    ctaLabel: 'Record Salary',
    prefill: { category: 3, claim: 'Salary disbursement — period: <YYYY-MM>, gross: ₹<amount>, net: ₹<amount>, days worked: <n>' },
    accent: 'bg-sage',
    shadow: 'shadow-brutal-sage',
    ribbon: 'bg-sage-light text-sage border-sage/30',
  },
  {
    key: 'gratuity',
    badge: 'Gratuity',
    title: 'Tenure milestone',
    desc:
      'Mark a worker\'s service-year milestone. Builds verifiable tenure across employers — the foundation for portable gratuity in a gig economy.',
    amount: '15 days / yr',
    cadence: 'Annual',
    ctaLabel: 'Record Tenure',
    prefill: { category: 1, claim: 'Service tenure milestone — completed year <n> as <role>' },
    accent: 'bg-lavender',
    shadow: 'shadow-brutal-lavender',
    ribbon: 'bg-lavender/30 text-charcoal border-lavender/50',
  },
]

const BenefitsPanel: React.FC<Props> = ({ workerCount, onIssue }) => {
  return (
    <div className="nb-card bg-white rounded-2xl p-6 md:p-8 shadow-brutal">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <span className="nb-tag bg-cream text-charcoal/60 border-charcoal/15 text-[9px] mb-2">Benefits & Compliance</span>
          <h3 className="font-display text-xl font-bold text-charcoal mt-1">
            Bring formal-economy benefits to gig workers
          </h3>
          <p className="text-charcoal/50 text-sm mt-1 max-w-2xl">
            Attest to PF, ESI, payroll, and tenure on-chain. Alora records the fact —{' '}
            <span className="font-semibold">your existing rails still process the money</span>. Workers carry the proof across
            employers, just like a traditional employee carries their EPFO passbook.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-charcoal/35 mb-1">In Roster</div>
          <div className="font-display text-3xl font-extrabold text-charcoal leading-none">{workerCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BENEFITS.map((b) => (
          <div key={b.key} className={`nb-card bg-white rounded-xl p-5 ${b.shadow} relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${b.accent} rounded-t-xl`} />
            <div className="flex items-start justify-between mb-3 pt-1">
              <span className={`nb-tag ${b.ribbon} text-[9px] tracking-[0.25em]`}>{b.badge}</span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-charcoal/35">{b.cadence}</span>
            </div>
            <h4 className="font-display text-base font-bold text-charcoal mb-1">{b.title}</h4>
            <p className="text-charcoal/55 text-xs leading-relaxed mb-3">{b.desc}</p>
            <div className="flex items-center justify-between pt-3 border-t-[1.5px] border-dashed border-charcoal/10">
              <div>
                <div className="font-mono text-[9px] tracking-[0.2em] uppercase text-charcoal/35 mb-0.5">Rate</div>
                <div className="font-mono text-xs font-semibold text-charcoal">{b.amount}</div>
              </div>
              <button
                onClick={() => onIssue({ subject: '', ...b.prefill })}
                className="nb-btn bg-charcoal text-cream px-3 py-1.5 text-[10px] font-display font-bold tracking-widest uppercase"
              >
                {b.ctaLabel}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t-[1.5px] border-dashed border-charcoal/15 text-[11px] font-mono text-charcoal/40 leading-relaxed">
        Alora records the attestation. Money flow stays with your existing PF/ESI rails or payroll provider. The chain becomes the
        worker's portable proof — usable at any future employer, NBFC, or housing application.
      </div>
    </div>
  )
}

export default BenefitsPanel
