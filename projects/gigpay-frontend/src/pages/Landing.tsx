import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const TICKER_ITEMS = [
  'ATOMIC SETTLEMENTS',
  'RATING-BASED PAYOUTS',
  'ESCROW-PROTECTED',
  'USDC ON ALGORAND',
  'ANTI-FRAUD ENGINE',
  'ONE-CLICK PAY',
  'REAL-TIME DELIVERY',
  'UPI OFF-RAMP',
]

const STATS = [
  { value: '300M+', label: 'Gig workers in India' },
  { value: '45%', label: 'Face delayed payments' },
  { value: '₹72K', label: 'Avg. monthly disputes' },
  { value: '14 days', label: 'Typical payout cycle' },
]

const RATING_TABLE = [
  { stars: '5.0', rating: 50, multiplier: 150, label: 'Exceptional', bar: 'w-full' },
  { stars: '4.0', rating: 40, multiplier: 128, label: 'Great', bar: 'w-[85%]' },
  { stars: '3.0', rating: 30, multiplier: 106, label: 'Standard', bar: 'w-[71%]' },
  { stars: '2.0', rating: 20, multiplier: 84, label: 'Below avg', bar: 'w-[56%]' },
  { stars: '1.0', rating: 10, multiplier: 62, label: 'Poor', bar: 'w-[41%]' },
]

const Landing: React.FC = () => {
  const [mounted, setMounted] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen font-sans relative overflow-hidden">
      <div className="noise-overlay" />

      {/* ══════════ LIGHT: NAV + HERO ══════════ */}
      <div className="bg-cream text-charcoal">
        {/* ── NAV ── */}
        <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 lg:px-16 py-7">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-terra" />
            <span className="font-serif text-2xl tracking-tight">GigPay</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#flow" className="text-sm text-charcoal/40 hover:text-charcoal transition-colors hidden md:block">Flow</a>
            <a href="#architecture" className="text-sm text-charcoal/40 hover:text-charcoal transition-colors hidden md:block">Architecture</a>
            <a href="#payouts" className="text-sm text-charcoal/40 hover:text-charcoal transition-colors hidden md:block">Payouts</a>
            <a href="#fraud" className="text-sm text-charcoal/40 hover:text-charcoal transition-colors hidden md:block">Anti-Fraud</a>
            <button
              onClick={() => navigate('/platform')}
              className="bg-terra text-cream px-5 py-2.5 text-sm font-medium hover:bg-terra-dark transition-colors"
            >
              Enter App
            </button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="relative z-10 px-6 md:px-12 md:pt-25 lg:px-20 pt-20 pb-20">
          <div className="grid md:grid-cols-12 gap-8 items-end py-10">
            <div className={`md:col-span-7 ${mounted ? 'animate-fade-up' : 'opacity-0'}`}>
              <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight mb-8">
                Pay gig workers
                <br />
                in seconds,
                <br />
                <span className="text-terra italic">not weeks.</span>
              </h1>

              <p className="text-charcoal/50 text-lg md:text-xl max-w-lg leading-relaxed mb-10 text-balance">
                Smart contracts calculate rating-based payouts. Workers get paid atomically the moment a delivery is confirmed.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/platform')}
                  className="group bg-terra text-cream px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-terra-dark transition-all"
                >
                  <span className="flex items-center gap-3">
                    Merchant Dashboard
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="square" d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>
                <button
                  onClick={() => navigate('/worker')}
                  className="border-2 border-charcoal/20 text-charcoal px-8 py-4 text-sm font-medium tracking-wide uppercase hover:bg-charcoal/5 transition-all"
                >
                  Worker Dashboard
                </button>
              </div>
            </div>

            <div className={`md:col-span-5 ${mounted ? 'animate-fade-up-delay-2' : 'opacity-0'}`}>
              <div className="border-2 border-charcoal/10 p-8 md:p-10 relative">
                <div className="absolute -top-[2px] -right-[2px] w-16 h-16">
                  <div className="absolute top-0 right-0 w-full h-[2px] bg-terra" />
                  <div className="absolute top-0 right-0 h-full w-[2px] bg-terra" />
                </div>
                <span className="font-mono text-[10px] tracking-[0.3em] text-charcoal/60 uppercase block mb-8">The Problem Today</span>
                <div className="grid grid-cols-2 gap-8">
                  {STATS.map((stat, i) => (
                    <div key={i}>
                      <div className="font-serif text-3xl md:text-4xl text-charcoal mb-1">{stat.value}</div>
                      <div className="text-xs text-charcoal/40 tracking-wide uppercase">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-charcoal/10">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-terra rounded-full" />
                    <span className="text-xs text-terra/80">GigPay fixes this</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── TICKER ── */}
      <div className="relative z-10 border-y-2 border-cream/10 py-6 bg-charcoal">
        <div className="ticker-strip">
          <div className="ticker-content">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-6 mx-6">
                <span className="font-mono text-[10px] tracking-[0.2em] text-cream/60 font-medium whitespace-nowrap">{item}</span>
                <span className="w-1.5 h-1.5 bg-terra flex-shrink-0" />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ LIGHT: PAYMENT FLOW ══════════ */}
      <section id="flow" className="relative z-10 bg-cream text-charcoal px-6 md:px-12 lg:px-16 py-24 md:py-32">
        <div className="grid md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <span className="font-mono text-[10px] tracking-[0.3em] text-charcoal/30 uppercase block mb-4">End-to-End Flow</span>
            <h2 className="font-serif text-4xl md:text-5xl leading-[1.1] mb-4">
              From deposit<br />to <span className="text-terra italic">bank account</span>
            </h2>
            <p className="text-charcoal/40 text-sm leading-relaxed max-w-xs">
              A single delivery payment touches 3 smart contracts in one atomic transaction.
              The worker sees USDC in their wallet before the merchant closes the tab.
            </p>
          </div>

          <div className="md:col-span-8">
            <div className="grid gap-0">
              {[
                {
                  step: '01',
                  title: 'Merchant deposits USDC to Escrow',
                  detail: 'Platform admin funds the EscrowPool smart contract with USDC. Funds are locked on-chain, visible and auditable by anyone.',
                  tag: 'ESCROW',
                  accent: 'bg-terra',
                },
                {
                  step: '02',
                  title: 'Workers registered on-chain',
                  detail: 'Merchant adds workers to the WorkerRegistry with name, phone, UPI ID, and initial rating. All stored in Algorand box storage.',
                  tag: 'REGISTRY',
                  accent: 'bg-sage',
                },
                {
                  step: '03',
                  title: 'Orders assigned to workers',
                  detail: 'Delivery orders are created in the DeliveryManager contract — customer name, pickup, dropoff, base amount, assigned worker.',
                  tag: 'DELIVERY',
                  accent: 'bg-charcoal/30',
                },
                {
                  step: '04',
                  title: 'Worker picks up & delivers',
                  detail: 'Merchant marks delivery as picked up. When delivered, a single "Confirm & Pay" action triggers everything in step 5.',
                  tag: 'STATUS',
                  accent: 'bg-charcoal/30',
                },
                {
                  step: '05',
                  title: 'Atomic on-chain payment',
                  detail: 'One signature fires 4 contract calls atomically: confirm delivery → release USDC from escrow → mark paid → update worker earnings. All or nothing.',
                  tag: 'ATOMIC',
                  accent: 'bg-terra',
                },
                {
                  step: '06',
                  title: 'Worker receives USDC → off-ramps to INR',
                  detail: 'USDC lands in the worker\'s Algorand wallet instantly. They can off-ramp to INR via UPI at ₹83.5/USDC. No payroll cycles, no intermediaries.',
                  tag: 'SETTLEMENT',
                  accent: 'bg-sage',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="group border-t border-charcoal/10 py-6 flex gap-6 md:gap-8 items-start hover:bg-charcoal/[0.02] transition-colors px-2 -mx-2"
                >
                  <div className="flex flex-col items-center gap-2 pt-1">
                    <span className="font-mono text-xs text-charcoal/20">{item.step}</span>
                    <div className={`w-1.5 h-1.5 ${item.accent} flex-shrink-0`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="text-base font-medium group-hover:text-terra transition-colors">{item.title}</h3>
                      <span className="font-mono text-[9px] tracking-[0.2em] text-terra/60 bg-terra/10 px-2 py-0.5 font-medium hidden md:inline">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-charcoal/40 text-sm leading-relaxed max-w-lg">{item.detail}</p>
                  </div>
                </div>
              ))}
              <div className="border-t border-charcoal/10" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ DARK: ARCHITECTURE ══════════ */}
      <section id="architecture" className="relative z-10 bg-charcoal text-cream">
        <div className="px-6 md:px-12 lg:px-16 py-24 md:py-32">
          <div className="flex items-center justify-between mb-16">
            <div>
              <span className="font-mono text-[10px] tracking-[0.3em] text-cream/30 uppercase block mb-4">Smart Contract Architecture</span>
              <h2 className="font-serif text-4xl md:text-5xl leading-[1.1]">
                Three contracts,<br /><span className="text-terra italic">one atomic flow</span>
              </h2>
            </div>
            <div className="hidden md:block text-right">
              <span className="font-mono text-[10px] text-cream/30 tracking-wide uppercase">Algorand Testnet</span>
            </div>
          </div>

          {/* Contract cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-16 stagger-children">
            {[
              {
                name: 'WorkerRegistry',
                tag: 'IDENTITY',
                desc: 'Stores worker profiles in box storage — name, phone, UPI ID, rating, earnings, tasks completed. 120 bytes per worker, fully on-chain.',
                methods: ['add_worker', 'update_rating', 'increment_earnings', 'get_worker_info'],
                storage: 'Box: wrk_{address} → 120B',
                color: 'bg-sage',
                borderColor: 'border-sage/40 hover:border-sage/70',
              },
              {
                name: 'DeliveryManager',
                tag: 'LOGISTICS',
                desc: 'Tracks delivery lifecycle from creation to payment. Calculates final payout using the rating-based multiplier formula.',
                methods: ['create_delivery', 'mark_picked_up', 'confirm_delivery', 'mark_paid'],
                storage: 'Box: dlv_{id} → 168B',
                color: 'bg-terra',
                borderColor: 'border-terra/40 hover:border-terra/70',
              },
              {
                name: 'EscrowPool',
                tag: 'TREASURY',
                desc: 'Custodies merchant USDC and releases payments to workers via inner transactions. Tracks total deposited and released.',
                methods: ['initialize', 'deposit_funds', 'release_payment', 'withdraw_unused'],
                storage: 'Box: pay_{worker}{id} → 24B',
                color: 'bg-cream',
                borderColor: 'border-cream/30 hover:border-cream/50',
              },
            ].map((contract) => (
              <div key={contract.name} className={`border-2 ${contract.borderColor} p-8 md:p-10 bg-soot relative group transition-colors`}>
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-3 h-3 ${contract.color}`} />
                  <span className="font-mono text-[9px] tracking-[0.3em] text-terra font-medium bg-terra/15 px-2.5 py-1">
                    {contract.tag}
                  </span>
                </div>

                <h3 className="font-serif text-2xl mb-3 text-cream group-hover:text-terra transition-colors">
                  {contract.name}
                </h3>

                <p className="text-cream/55 text-sm leading-relaxed mb-5">
                  {contract.desc}
                </p>

                <div className="space-y-2 mb-5">
                  <div className="font-mono text-[9px] tracking-[0.2em] text-cream/35 uppercase">ABI Methods</div>
                  <div className="flex flex-wrap gap-1.5">
                    {contract.methods.map((m) => (
                      <span key={m} className="font-mono text-[10px] bg-cream/[0.08] text-cream/60 px-2 py-1">
                        {m}()
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-cream/15">
                  <span className="font-mono text-[10px] text-cream/40">{contract.storage}</span>
                </div>

                <div className="absolute bottom-0 left-0 h-[3px] w-0 bg-terra group-hover:w-full transition-all duration-500" />
              </div>
            ))}
          </div>

          {/* Atomic flow diagram */}
          <div className="border-2 border-cream/20 p-8 md:p-12 bg-soot">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-2 bg-terra" />
              <span className="font-mono text-[10px] tracking-[0.3em] text-cream/50 uppercase font-medium">
                Atomic Transaction Group — "Confirm & Pay"
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-0">
              {[
                { num: 'TXN 1', contract: 'DeliveryManager', method: 'confirm_delivery()', desc: 'Calculate final payout from rating' },
                { num: 'TXN 2', contract: 'EscrowPool', method: 'release_payment()', desc: 'Inner txn sends USDC to worker' },
                { num: 'TXN 3', contract: 'DeliveryManager', method: 'mark_paid()', desc: 'Update delivery status to paid' },
                { num: 'TXN 4', contract: 'WorkerRegistry', method: 'increment_earnings()', desc: 'Update worker total earned' },
              ].map((txn, i) => (
                <div key={i} className="relative">
                  <div className="border border-cream/15 p-5 md:border-r-0 last:md:border-r hover:bg-cream/[0.04] transition-colors">
                    <span className="font-mono text-[9px] tracking-[0.2em] text-terra font-medium block mb-3">{txn.num}</span>
                    <div className="font-mono text-xs text-cream/70 mb-1">{txn.contract}</div>
                    <div className="font-mono text-[11px] text-terra mb-2">{txn.method}</div>
                    <p className="text-[11px] text-cream/40 leading-relaxed">{txn.desc}</p>
                  </div>
                  {i < 3 && (
                    <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-5 h-5 bg-soot border border-cream/20 items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-terra" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="square" d="M5 12h14" />
                        <path strokeLinecap="square" d="M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-cream/15 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-sage rounded-full" />
                <span className="text-xs text-cream/50">All 4 succeed or all 4 revert</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-terra rounded-full" />
                <span className="text-xs text-cream/50">Single wallet signature</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cream/30 rounded-full" />
                <span className="text-xs text-cream/50">~4 seconds finality</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ LIGHT: PAYOUT CALCULATION ══════════ */}
      <section id="payouts" className="relative z-10 bg-cream text-charcoal px-6 md:px-12 lg:px-16 py-24 md:py-32">
        <div className="grid md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-5">
            <span className="font-mono text-[10px] tracking-[0.3em] text-charcoal/30 uppercase block mb-4">Payout Engine</span>
            <h2 className="font-serif text-4xl md:text-5xl leading-[1.1] mb-6">
              Performance<br />determines <span className="text-terra italic">pay</span>
            </h2>
            <p className="text-charcoal/45 leading-relaxed mb-8 max-w-sm">
              Every payout is calculated on-chain using a rating-based multiplier.
              Higher-rated workers earn more per delivery. The formula is transparent,
              immutable, and verifiable by anyone.
            </p>

            {/* Formula */}
            <div className="border-2 border-charcoal bg-charcoal p-6 mb-8 text-cream">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-cream/10" />
                <div className="w-3 h-3 rounded-full bg-cream/10" />
                <div className="w-3 h-3 rounded-full bg-cream/10" />
                <span className="text-cream/20 font-mono text-[10px] ml-3">contract.py</span>
              </div>
              <pre className="text-cream/60 text-sm leading-relaxed font-mono"><code>{`# On-chain payout formula
multiplier = 40 + (rating × 22) / 10
final_amount = (base × multiplier) / 100

# Example: ★4.0 worker, $0.25 base
# multiplier = 40 + (40 × 22) / 10 = 128
# final = ($0.25 × 128) / 100 = $0.32`}</code></pre>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-sage mt-2 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium">Transparent</div>
                  <div className="text-xs text-charcoal/40">Formula is in the smart contract — anyone can verify</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-terra mt-2 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium">Immutable</div>
                  <div className="text-xs text-charcoal/40">No one can change the math after deployment</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 bg-charcoal/30 mt-2 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium">Instant</div>
                  <div className="text-xs text-charcoal/40">Calculated and paid in the same atomic transaction</div>
                </div>
              </div>
            </div>
          </div>

          {/* Rating table */}
          <div className="md:col-span-7">
            <div className="border-2 border-charcoal/10 p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-[10px] tracking-[0.3em] text-charcoal/30 uppercase">Rating Multiplier Table</span>
                <span className="font-mono text-[10px] text-charcoal/25">base = $0.25 USDC</span>
              </div>

              <div className="space-y-0">
                {/* Header */}
                <div className="grid grid-cols-12 gap-3 pb-3 border-b border-charcoal/10 font-mono text-[9px] tracking-[0.2em] text-charcoal/30 uppercase">
                  <div className="col-span-2">Rating</div>
                  <div className="col-span-2">Multiplier</div>
                  <div className="col-span-5">Payout Scale</div>
                  <div className="col-span-2 text-right">Payout</div>
                  <div className="col-span-1 text-right">Δ</div>
                </div>

                {RATING_TABLE.map((row, i) => {
                  const payout = (0.25 * row.multiplier / 100).toFixed(3)
                  const delta = ((row.multiplier - 100)).toFixed(0)
                  const isPositive = row.multiplier >= 100
                  return (
                    <div
                      key={i}
                      className="grid grid-cols-12 gap-3 py-4 border-b border-charcoal/[0.06] items-center hover:bg-charcoal/[0.02] transition-colors"
                    >
                      <div className="col-span-2">
                        <span className="text-sm font-medium">{row.stars}</span>
                        <span className="text-terra ml-1">★</span>
                        <div className="text-[10px] text-charcoal/30 mt-0.5">{row.label}</div>
                      </div>
                      <div className="col-span-2">
                        <span className="font-mono text-sm text-charcoal/60">{row.multiplier}%</span>
                      </div>
                      <div className="col-span-5 flex items-center gap-3">
                        <div className="flex-1 h-2 bg-charcoal/[0.06] overflow-hidden">
                          <div
                            className={`h-full ${row.multiplier >= 120 ? 'bg-sage' : row.multiplier >= 100 ? 'bg-charcoal/15' : 'bg-terra/60'} ${row.bar} transition-all duration-700`}
                          />
                        </div>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="font-mono text-sm text-charcoal">${payout}</span>
                      </div>
                      <div className="col-span-1 text-right">
                        <span className={`font-mono text-xs ${isPositive ? 'text-sage' : 'text-terra'}`}>
                          {isPositive ? '+' : ''}{delta}%
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-charcoal/10">
                <div className="font-mono text-[11px] text-charcoal/35 leading-relaxed">
                  Formula: <span className="text-charcoal/50">multiplier = 40 + (rating × 22) / 10</span>
                  <br />
                  Rating is stored as integer 10–50 (representing 1.0–5.0 stars)
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ DARK: ANTI-FRAUD ══════════ */}
      <section id="fraud" className="relative z-10 bg-charcoal text-cream px-6 md:px-12 lg:px-16 py-24 md:py-32">
        <div className="grid md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-5">
            <span className="font-mono text-[10px] tracking-[0.3em] text-cream/30 uppercase block mb-4">Anti-Fraud Mechanism</span>
            <h2 className="font-serif text-4xl md:text-5xl leading-[1.1] mb-6">
              Bad delivery?<br /><span className="text-terra italic">Money talks.</span>
            </h2>
            <p className="text-cream/40 leading-relaxed mb-6 max-w-sm">
              Workers who deliver poorly or attempt scams don't get banned — they get paid less.
              The rating system is the enforcement mechanism. Lower rating = lower multiplier = less money on every future delivery.
            </p>
            <p className="text-cream/40 leading-relaxed max-w-sm">
              This creates a self-correcting incentive: the cost of fraud is immediate and
              compounds with every subsequent delivery. No disputes, no manual review — the math handles it.
            </p>
          </div>

          <div className="md:col-span-7 space-y-6">
            {/* Scenario cards */}
            <div className="border border-cream/10 p-6 md:p-8 bg-soot">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 bg-sage" />
                <span className="font-mono text-[10px] tracking-[0.2em] text-sage/80 uppercase font-medium">Good Worker Scenario</span>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-4">
                <div>
                  <div className="font-mono text-[10px] tracking-[0.2em] text-cream/25 uppercase mb-1">Rating</div>
                  <div className="font-serif text-2xl text-cream">4.5 <span className="text-terra text-base">★</span></div>
                </div>
                <div>
                  <div className="font-mono text-[10px] tracking-[0.2em] text-cream/25 uppercase mb-1">Multiplier</div>
                  <div className="font-serif text-2xl text-sage">139%</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] tracking-[0.2em] text-cream/25 uppercase mb-1">Per $0.25 delivery</div>
                  <div className="font-serif text-2xl text-cream">$0.347</div>
                </div>
              </div>
              <div className="text-xs text-cream/30">
                Consistent good deliveries → rating stays high → earns 39% bonus on every order
              </div>
            </div>

            <div className="border border-terra/30 p-6 md:p-8 bg-terra/[0.04]">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 bg-terra" />
                <span className="font-mono text-[10px] tracking-[0.2em] text-terra/80 uppercase font-medium">Fraud / Bad Delivery Scenario</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 text-right">
                    <span className="font-mono text-xs text-cream/30">Before</span>
                  </div>
                  <div className="flex-1 flex items-center gap-4">
                    <span className="text-sm">4.5★ → 139% → <span className="font-mono text-sage">$0.347</span></span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 text-right">
                    <span className="font-mono text-xs text-terra">Scam</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-cream/40">
                      Worker marks delivered but didn't deliver → merchant drops rating
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 text-right">
                    <span className="font-mono text-xs text-cream/30">After</span>
                  </div>
                  <div className="flex-1 flex items-center gap-4">
                    <span className="text-sm">2.0★ → 84% → <span className="font-mono text-terra">$0.210</span></span>
                  </div>
                </div>

                <div className="border-t border-terra/20 pt-4 mt-2">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-terra flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span className="text-sm text-terra font-medium">
                      −$0.137 per delivery (−39% pay cut)
                    </span>
                  </div>
                  <p className="text-xs text-cream/30 mt-2 ml-7">
                    Every future delivery earns less until rating improves. Over 10 deliveries, that's $1.37 lost — far more than what one scam gains.
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-cream/10 p-5 bg-soot">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="font-serif text-xl text-cream mb-1">No bans</div>
                  <div className="font-mono text-[9px] text-cream/30 uppercase tracking-wider">Economic penalty instead</div>
                </div>
                <div>
                  <div className="font-serif text-xl text-cream mb-1">No disputes</div>
                  <div className="font-mono text-[9px] text-cream/30 uppercase tracking-wider">Math is the arbiter</div>
                </div>
                <div>
                  <div className="font-serif text-xl text-cream mb-1">Self-healing</div>
                  <div className="font-mono text-[9px] text-cream/30 uppercase tracking-wider">Good work restores pay</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ LIGHT: WHY ALGORAND ══════════ */}
      <section className="relative z-10 bg-cream text-charcoal px-6 md:px-12 lg:px-16 py-24 md:py-32">
        <div className="grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-5">
            <span className="font-mono text-[10px] tracking-[0.3em] text-charcoal/30 uppercase block mb-4">Infrastructure</span>
            <h2 className="font-serif text-4xl md:text-5xl leading-[1.1] mb-6">
              Why <span className="text-terra italic">Algorand?</span>
            </h2>
            <p className="text-charcoal/45 leading-relaxed max-w-sm">
              Gig payments need sub-cent fees and instant finality. Algorand settles
              in under 3 seconds for a fraction of a cent. No other chain handles
              payroll-scale micro-transactions this efficiently.
            </p>
          </div>

          <div className="md:col-span-7">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: 'Finality', value: '~3s', note: 'Instant settlement' },
                { label: 'Tx Fee', value: '0.001', note: 'ALGO per txn' },
                { label: 'TPS', value: '10,000+', note: 'Enterprise scale' },
                { label: 'Carbon', value: 'Negative', note: 'Green blockchain' },
                { label: 'Uptime', value: '100%', note: 'Since genesis' },
                { label: 'Contracts', value: 'AVM', note: 'Box storage + inner txns' },
              ].map((item, i) => (
                <div key={i} className="border-2 border-charcoal/10 p-5 hover:border-terra/30 transition-colors group">
                  <div className="font-mono text-[10px] tracking-[0.2em] text-charcoal/30 uppercase mb-3">{item.label}</div>
                  <div className="font-serif text-xl md:text-2xl mb-1 group-hover:text-terra transition-colors">{item.value}</div>
                  <div className="text-xs text-charcoal/35">{item.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ DARK: TECH STACK ══════════ */}
      <div className="bg-charcoal text-cream">
        <section className="relative z-10 px-6 md:px-12 lg:px-16 py-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-[60px] h-[3px] bg-terra" />
            <span className="font-mono text-[10px] tracking-[0.3em] text-cream/50 uppercase font-medium">Tech Stack</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              'Algorand AVM',
              'PuyaPy Smart Contracts',
              'ARC-56 App Specs',
              'AlgoKit Utils',
              'USDC (ASA 10458941)',
              'Box Storage',
              'Inner Transactions',
              'Atomic Groups',
              'React + TypeScript',
            ].map((tech) => (
              <span key={tech} className="font-mono text-[11px] text-cream/60 border border-cream/10 px-3 py-2 hover:border-terra/40 hover:text-terra transition-colors">
                {tech}
              </span>
            ))}
          </div>
        </section>
      </div>

      {/* ══════════ LIGHT: CTA + FOOTER ══════════ */}
      <div className="bg-cream text-charcoal">
        {/* ── CTA ── */}
        <section className="relative z-10 px-6 md:px-12 lg:px-16 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="accent-line mx-auto mb-8" />
            <h2 className="font-serif text-4xl md:text-6xl leading-[1.05] mb-6">
              Stop running payroll<br />
              <span className="text-terra italic">manually.</span>
            </h2>
            <p className="text-charcoal/45 text-lg mb-10 max-w-lg mx-auto text-balance">
              Your riders, drivers, and delivery partners deserve real-time pay
              tied to real performance. One atomic transaction. No spreadsheets.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate('/platform')}
                className="bg-terra text-cream px-10 py-5 text-sm font-medium tracking-[0.15em] uppercase hover:bg-terra-dark transition-all inline-flex items-center gap-3"
              >
                Merchant Dashboard
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="square" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/worker')}
                className="border-2 border-charcoal/20 text-charcoal px-10 py-5 text-sm font-medium tracking-[0.15em] uppercase hover:bg-charcoal/5 transition-all"
              >
                Worker Dashboard
              </button>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="relative z-10 border-t border-charcoal/[0.08] px-6 md:px-12 lg:px-16 py-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-terra" />
              <span className="font-serif text-lg">GigPay</span>
              <span className="text-charcoal/25 text-xs ml-4">On-Chain Gig Payment Infrastructure</span>
            </div>
            <div className="flex items-center gap-8 font-mono text-[10px] text-charcoal/30">
              <span>Built on Algorand</span>
              <span className="w-1 h-1 bg-charcoal/15" />
              <span>USDC Settlements</span>
              <span className="w-1 h-1 bg-charcoal/15" />
              <span>Atomic Transactions</span>
              <span className="w-1 h-1 bg-charcoal/15" />
              <span>Rating-Based Payouts</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default Landing
