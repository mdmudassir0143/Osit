import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AloraLogo from '../components/shared/AloraLogo'

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
  { value: '300M+', label: 'Gig workers in India', accent: 'bg-sun' },
  { value: '45%', label: 'Face delayed payments', accent: 'bg-terra' },
  { value: '72K', label: 'Monthly disputes (avg)', accent: 'bg-lavender' },
  { value: '14 days', label: 'Typical payout cycle', accent: 'bg-sage' },
]

const RATING_TABLE = [
  { stars: '5.0', rating: 50, multiplier: 150, label: 'Exceptional', pct: 100 },
  { stars: '4.0', rating: 40, multiplier: 128, label: 'Great', pct: 85 },
  { stars: '3.0', rating: 30, multiplier: 106, label: 'Standard', pct: 71 },
  { stars: '2.0', rating: 20, multiplier: 84, label: 'Below avg', pct: 56 },
  { stars: '1.0', rating: 10, multiplier: 62, label: 'Poor', pct: 41 },
]

const FLOW_STEPS = [
  {
    step: '01',
    title: 'Merchant deposits USDC',
    detail: 'Platform admin funds the EscrowPool contract. Funds locked on-chain, visible and auditable.',
    tag: 'ESCROW',
    color: 'bg-sun text-charcoal',
    shadow: 'shadow-brutal-sun',
  },
  {
    step: '02',
    title: 'Workers registered on-chain',
    detail: 'Workers added to the registry with name, phone, UPI, and initial rating. All in Algorand box storage.',
    tag: 'REGISTRY',
    color: 'bg-sage text-white',
    shadow: 'shadow-brutal-sage',
  },
  {
    step: '03',
    title: 'Orders assigned to workers',
    detail: 'Delivery orders created in the DeliveryManager — customer, pickup, dropoff, base amount, assigned worker.',
    tag: 'DELIVERY',
    color: 'bg-lavender text-charcoal',
    shadow: 'shadow-brutal-lavender',
  },
  {
    step: '04',
    title: 'Worker picks up & delivers',
    detail: 'Merchant marks pickup. On delivery, a single "Confirm & Pay" triggers everything atomically.',
    tag: 'STATUS',
    color: 'bg-cream text-charcoal',
    shadow: 'shadow-brutal',
  },
  {
    step: '05',
    title: 'Atomic on-chain payment',
    detail: 'One signature fires 4 contract calls: confirm → release USDC → mark paid → update earnings. All or nothing.',
    tag: 'ATOMIC',
    color: 'bg-terra text-white',
    shadow: 'shadow-brutal-terra',
  },
  {
    step: '06',
    title: 'Worker gets USDC → off-ramps',
    detail: 'USDC lands instantly. Off-ramp to INR via UPI. No payroll cycles, no intermediaries.',
    tag: 'SETTLE',
    color: 'bg-sun text-charcoal',
    shadow: 'shadow-brutal-sun',
  },
]

const CONTRACTS = [
  {
    name: 'WorkerRegistry',
    tag: 'IDENTITY',
    desc: 'Worker profiles in box storage — name, phone, UPI ID, rating, earnings, tasks completed. 120 bytes per worker, fully on-chain.',
    methods: ['add_worker', 'update_rating', 'increment_earnings', 'get_worker_info'],
    storage: 'Box: wrk_{address} → 120B',
    accent: 'bg-sage',
    shadow: 'shadow-brutal-sage',
    tagBg: 'bg-sage-light text-sage',
  },
  {
    name: 'DeliveryManager',
    tag: 'LOGISTICS',
    desc: 'Tracks delivery lifecycle from creation to payment. Calculates final payout via the rating multiplier formula.',
    methods: ['create_delivery', 'mark_picked_up', 'confirm_delivery', 'mark_paid'],
    storage: 'Box: dlv_{id} → 168B',
    accent: 'bg-terra',
    shadow: 'shadow-brutal-terra',
    tagBg: 'bg-terra-light text-terra',
  },
  {
    name: 'EscrowPool',
    tag: 'TREASURY',
    desc: 'Custodies USDC and releases payments to workers via inner transactions. Tracks deposits and releases.',
    methods: ['initialize', 'deposit_funds', 'release_payment', 'withdraw_unused'],
    storage: 'Box: pay_{worker}{id} → 24B',
    accent: 'bg-sun',
    shadow: 'shadow-brutal-sun',
    tagBg: 'bg-sun-light text-charcoal',
  },
]

const Landing: React.FC = () => {
  const [mounted, setMounted] = useState(false)
  const [appMenuOpen, setAppMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!appMenuOpen) return
    const close = () => setAppMenuOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [appMenuOpen])

  return (
    <div className="min-h-screen font-sans relative overflow-hidden bg-cream">
      <div className="noise-overlay" />

      {/* ═══════════ NAV ═══════════ */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 lg:px-20 py-5 border-b-[2.5px] border-charcoal bg-cream">
        <AloraLogo size="md" />
        <div className="flex items-center gap-8">
          <a href="#flow" className="text-sm font-medium text-charcoal/50 hover:text-charcoal transition-colors hidden md:block">Flow</a>
          <a href="#architecture" className="text-sm font-medium text-charcoal/50 hover:text-charcoal transition-colors hidden md:block">Architecture</a>
          <a href="#payouts" className="text-sm font-medium text-charcoal/50 hover:text-charcoal transition-colors hidden md:block">Payouts</a>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setAppMenuOpen((v) => !v) }}
              className="nb-btn bg-terra text-cream px-5 py-2.5 text-sm font-display font-bold flex items-center gap-2.5 shadow-brutal-sm"
            >
              Launch App
              <svg className={`w-3.5 h-3.5 transition-transform ${appMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {appMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border-[2.5px] border-charcoal rounded-xl shadow-brutal-lg overflow-hidden z-50">
                <button
                  onClick={() => navigate('/platform')}
                  className="w-full text-left px-5 py-4 hover:bg-sun/10 transition-colors border-b-2 border-charcoal/10 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-terra rounded-lg border-2 border-charcoal flex items-center justify-center flex-shrink-0">
                      <span className="text-cream text-xs font-bold">M</span>
                    </div>
                    <div>
                      <div className="font-display text-sm font-bold group-hover:text-terra transition-colors">Merchant</div>
                      <div className="text-[11px] text-charcoal/40">Manage escrow & workers</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/worker')}
                  className="w-full text-left px-5 py-4 hover:bg-sage/10 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-sage rounded-lg border-2 border-charcoal flex items-center justify-center flex-shrink-0">
                      <span className="text-cream text-xs font-bold">W</span>
                    </div>
                    <div>
                      <div className="font-display text-sm font-bold group-hover:text-sage transition-colors">Worker</div>
                      <div className="text-[11px] text-charcoal/40">View earnings & deliveries</div>
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative z-10 px-6 md:px-12 lg:px-20 pt-16 md:pt-24 pb-20">
        {/* Grid dots bg */}
        <div className="absolute inset-0 grid-dots pointer-events-none" />
        <div className="relative grid md:grid-cols-12 gap-10 items-start">
          {/* Left — headline */}
          <div className={`md:col-span-7 ${mounted ? 'animate-fade-up' : 'opacity-0'}`}>

            <h1 className="font-display text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold leading-[0.95] tracking-tight mb-8">
              Pay gig workers{' '}
              <span className="relative inline-block">
                in seconds
                <svg className="absolute -bottom-1 left-0 w-full" height="8" viewBox="0 0 200 8" preserveAspectRatio="none">
                  <path d="M0 5 Q50 0 100 5 T200 5" stroke="#c44b2b" strokeWidth="3" fill="none" />
                </svg>
              </span>
              <br />
              <span className="font-serif italic text-terra font-normal">not weeks.</span>
            </h1>

            <p className="text-charcoal/55 text-lg md:text-xl max-w-lg leading-relaxed mb-10">
              Smart contracts calculate rating-based payouts. Workers get paid
              atomically the moment a delivery is confirmed.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/platform')}
                className="nb-btn bg-terra text-cream px-8 py-4 text-sm tracking-wide font-display font-bold uppercase"
              >
                Merchant Dashboard &rarr;
              </button>
              <button
                onClick={() => navigate('/worker')}
                className="nb-btn bg-cream text-charcoal px-8 py-4 text-sm tracking-wide font-display font-bold uppercase"
              >
                Worker Dashboard
              </button>
            </div>
          </div>

          {/* Right — stats card */}
          <div className={`md:col-span-5 ${mounted ? 'animate-fade-up-delay-2' : 'opacity-0'}`}>
            <div className="nb-card p-8 md:p-10 bg-white rounded-2xl shadow-brutal-lg relative">
              {/* Corner accent */}
              <div className="absolute -top-3 -right-3 w-10 h-10 bg-sun rounded-lg border-[2.5px] border-charcoal flex items-center justify-center">
                <span className="text-charcoal text-lg">!</span>
              </div>

              <span className="nb-tag bg-terra-light text-terra border-terra/40 text-[9px] mb-6">
                The Problem Today
              </span>

              <div className="grid grid-cols-2 gap-5 mt-6">
                {STATS.map((stat, i) => (
                  <div key={i} className="relative">
                    <div className={`w-2.5 h-2.5 ${stat.accent} rounded-full border-[1.5px] border-charcoal mb-2`} />
                    <div className="font-display text-2xl md:text-3xl font-extrabold text-charcoal leading-none mb-1">
                      {stat.value}
                    </div>
                    <div className="text-xs text-charcoal/40 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-7 pt-5 border-t-2 border-dashed border-charcoal/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 bg-terra rounded-full animate-pulse" />
                  <span className="text-xs text-terra font-semibold">Alora fixes this</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TICKER ═══════════ */}
      <div className="relative z-10 border-y-[2.5px] border-charcoal py-4 bg-charcoal">
        <div className="ticker-strip">
          <div className="ticker-content">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-5 mx-5">
                <span className="font-display text-xs tracking-widest text-cream/70 font-bold whitespace-nowrap uppercase">{item}</span>
                <span className="w-2 h-2 bg-terra rounded-full flex-shrink-0" />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════ PAYMENT FLOW ═══════════ */}
      <section id="flow" className="relative z-10 bg-cream px-6 md:px-12 lg:px-20 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <span className="nb-tag bg-sun-light text-charcoal border-charcoal/20 font-mono text-[9px] mb-4">End-to-End Flow</span>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight mt-4 mb-3">
              From deposit to{' '}
              <span className="font-serif italic text-terra font-normal">bank account</span>
            </h2>
            <p className="text-charcoal/45 text-base max-w-xl">
              A single delivery payment touches 3 smart contracts in one atomic
              transaction. The worker sees USDC before the merchant closes the tab.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FLOW_STEPS.map((item) => (
              <div
                key={item.step}
                className={`nb-card bg-white rounded-xl p-6 ${item.shadow} relative`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-10 h-10 ${item.color} rounded-lg border-2 border-charcoal flex items-center justify-center`}>
                    <span className="font-mono text-sm font-bold">{item.step}</span>
                  </div>
                  <span className="nb-tag text-[9px] bg-cream border-charcoal/15">{item.tag}</span>
                </div>
                <h3 className="font-display text-base font-bold mb-2">{item.title}</h3>
                <p className="text-charcoal/45 text-sm leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ SECTION DIVIDER — ARCHITECTURE ═══════════ */}
      <div className="relative z-10 bg-cream">
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20">
          <div className="border-t-[2.5px] border-charcoal/10" />
        </div>
        <div className="flex items-center justify-center -mt-4">
          <div className="bg-cream px-6 flex items-center gap-3">
            <div className="w-3 h-3 bg-terra rounded-full border-2 border-charcoal" />
            <span className="font-mono text-[10px] tracking-[0.25em] text-charcoal/30 uppercase font-medium">Architecture</span>
            <div className="w-3 h-3 bg-terra rounded-full border-2 border-charcoal" />
          </div>
        </div>
      </div>

      {/* ═══════════ ARCHITECTURE ═══════════ */}
      <section id="architecture" className="relative z-10 bg-cream">
        <div className="px-6 md:px-12 lg:px-20 pt-12 pb-24 md:pb-32">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
              <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">
                Three contracts,{' '}
                <span className="font-serif italic text-terra font-normal">one atomic flow</span>
              </h2>
              <span className="nb-tag bg-sun-light text-charcoal border-charcoal/15 font-mono text-[9px]">Algorand TestNet</span>
            </div>

            {/* Contract cards */}
            <div className="grid md:grid-cols-3 gap-5 mb-12 stagger-children">
              {CONTRACTS.map((contract) => (
                <div
                  key={contract.name}
                  className={`nb-card bg-white rounded-2xl p-6 ${contract.shadow} group relative overflow-hidden`}
                >
                  {/* Top accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${contract.accent} rounded-t-2xl`} />

                  <div className="flex items-start justify-between mb-4 pt-2">
                    <div className={`w-9 h-9 ${contract.accent} rounded-lg border-2 border-charcoal flex items-center justify-center`}>
                      <span className="text-white text-xs font-bold font-mono">{contract.name.charAt(0)}</span>
                    </div>
                    <span className={`nb-tag ${contract.tagBg} border-charcoal/10 text-[9px]`}>
                      {contract.tag}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold mb-2 group-hover:text-terra transition-colors">
                    {contract.name}
                  </h3>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {contract.methods.map((m) => (
                      <span key={m} className="font-mono text-[10px] bg-cream text-charcoal/50 px-2 py-0.5 rounded-md border border-charcoal/10">
                        {m}()
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t-2 border-dashed border-charcoal/8">
                    <span className="font-mono text-[10px] text-charcoal/35">{contract.storage}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Atomic flow diagram */}
            <div className="nb-card bg-white rounded-2xl p-6 md:p-8 shadow-brutal">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-terra rounded-lg border-2 border-charcoal flex items-center justify-center">
                  <span className="text-cream text-xs font-bold">&#9889;</span>
                </div>
                <span className="font-display text-sm font-bold uppercase tracking-wide">
                  Atomic "Confirm &amp; Pay"
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                  { num: '1', contract: 'DeliveryManager', method: 'confirm_delivery()', color: 'bg-terra' },
                  { num: '2', contract: 'EscrowPool', method: 'release_payment()', color: 'bg-sun' },
                  { num: '3', contract: 'DeliveryManager', method: 'mark_paid()', color: 'bg-lavender' },
                  { num: '4', contract: 'WorkerRegistry', method: 'increment_earnings()', color: 'bg-sage' },
                ].map((txn, i) => (
                  <div key={i} className="relative">
                    <div className="border-[2px] border-charcoal/10 rounded-xl p-4 hover:bg-cream/50 transition-colors h-full">
                      <div className={`w-7 h-7 ${txn.color} rounded-lg border-2 border-charcoal flex items-center justify-center mb-3`}>
                        <span className="text-white text-xs font-bold font-mono">{txn.num}</span>
                      </div>
                      <div className="font-mono text-[11px] text-charcoal/50 mb-0.5">{txn.contract}</div>
                      <div className="font-mono text-[11px] text-terra font-semibold">{txn.method}</div>
                    </div>
                    {i < 3 && (
                      <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-6 h-6 bg-cream border-2 border-charcoal/15 rounded-full items-center justify-center">
                        <span className="text-terra text-xs font-bold">&rarr;</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t-2 border-dashed border-charcoal/8 flex flex-wrap items-center gap-5">
                {[
                  { color: 'bg-sage', text: 'All-or-nothing' },
                  { color: 'bg-terra', text: 'Single signature' },
                  { color: 'bg-sun', text: '~4s finality' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 ${item.color} rounded-full border-[1.5px] border-charcoal`} />
                    <span className="text-xs text-charcoal/40 font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SECTION DIVIDER — PAYOUTS ═══════════ */}
      <div className="relative z-10 bg-cream">
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20">
          <div className="border-t-[2.5px] border-charcoal/10" />
        </div>
        <div className="flex items-center justify-center -mt-4">
          <div className="bg-cream px-6 flex items-center gap-3">
            <div className="w-3 h-3 bg-lavender rounded-full border-2 border-charcoal" />
            <span className="font-mono text-[10px] tracking-[0.25em] text-charcoal/30 uppercase font-medium">Payout Engine</span>
            <div className="w-3 h-3 bg-lavender rounded-full border-2 border-charcoal" />
          </div>
        </div>
      </div>

      {/* ═══════════ PAYOUT — HEADER ═══════════ */}
      <section id="payouts" className="relative z-10 bg-cream px-6 md:px-12 lg:px-20 pt-12 pb-10">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
            Performance determines{' '}
            <span className="font-serif italic text-terra font-normal">pay</span>
          </h2>
          <p className="text-charcoal/45 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Every payout is calculated on-chain using a rating-based multiplier.
            Higher-rated workers earn more per delivery. The formula is transparent,
            immutable, and verifiable by anyone.
          </p>
        </div>
      </section>

      {/* ═══════════ PAYOUT — FORMULA + FEATURES ═══════════ */}
      <section className="relative z-10 bg-cream px-6 md:px-12 lg:px-20 pb-10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-5">
          {/* Formula card — takes 2 cols */}
          <div className="md:col-span-2 nb-card bg-charcoal rounded-xl p-6 md:p-8 shadow-brutal-terra text-cream">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-terra" />
                <div className="w-3 h-3 rounded-full bg-sun" />
                <div className="w-3 h-3 rounded-full bg-sage" />
                <span className="text-cream/25 font-mono text-[10px] ml-3">contract.py</span>
              </div>
              <span className="nb-tag bg-cream/10 text-cream/50 border-cream/15 text-[9px]">On-Chain Formula</span>
            </div>
            <pre className="text-cream/60 text-sm md:text-base leading-relaxed font-mono overflow-x-auto"><code>{`# On-chain payout formula
multiplier = 40 + (rating * 22) / 10
final_amount = (base * multiplier) / 100

# Example: 4.0 star worker, $0.25 base
# multiplier = 40 + (40 * 22) / 10 = 128
# final = ($0.25 * 128) / 100 = $0.32`}</code></pre>
          </div>

          {/* Features — 1 col, stacked cards */}
          <div className="space-y-4">
            {[
              { color: 'bg-sage', shadow: 'shadow-brutal-sage', title: 'Transparent', desc: 'Formula lives in the smart contract — anyone can verify on-chain' },
              { color: 'bg-terra', shadow: 'shadow-brutal-terra', title: 'Immutable', desc: 'No one can change the math after deployment' },
              { color: 'bg-sun', shadow: 'shadow-brutal-sun', title: 'Instant', desc: 'Calculated and paid in the same atomic txn' },
            ].map((item) => (
              <div key={item.title} className={`nb-card bg-white rounded-xl p-5 ${item.shadow}`}>
                <div className="flex items-center gap-3 mb-1.5">
                  <div className={`w-3 h-3 ${item.color} rounded-sm border-[1.5px] border-charcoal flex-shrink-0`} />
                  <span className="font-display text-sm font-bold">{item.title}</span>
                </div>
                <p className="text-xs text-charcoal/45 leading-relaxed pl-6">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ PAYOUT — RATING TABLE ═══════════ */}
      <section className="relative z-10 bg-cream px-6 md:px-12 lg:px-20 pb-24 md:pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="nb-card bg-white rounded-2xl p-6 md:p-8 shadow-brutal-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-lavender rounded-lg border-2 border-charcoal flex items-center justify-center">
                  <span className="text-white text-xs font-bold">&#9733;</span>
                </div>
                <span className="font-display text-base font-bold uppercase tracking-wide">Rating Multiplier Table</span>
              </div>
              <span className="nb-tag bg-cream text-charcoal/50 border-charcoal/10 text-[9px]">base = $0.25 USDC</span>
            </div>

            {/* Header */}
            <div className="grid grid-cols-12 gap-3 pb-3 border-b-[2.5px] border-charcoal/10 font-mono text-[9px] tracking-widest text-charcoal/30 uppercase">
              <div className="col-span-2">Rating</div>
              <div className="col-span-2">Multiplier</div>
              <div className="col-span-5">Payout Scale</div>
              <div className="col-span-2 text-right">Payout</div>
              <div className="col-span-1 text-right">Delta</div>
            </div>

            {RATING_TABLE.map((row, i) => {
              const payout = (0.25 * row.multiplier / 100).toFixed(3)
              const delta = row.multiplier - 100
              const isPositive = delta >= 0
              const barColor = row.multiplier >= 120 ? 'bg-sage' : row.multiplier >= 100 ? 'bg-charcoal/20' : 'bg-terra'
              return (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-3 py-4 border-b-2 border-charcoal/[0.05] items-center hover:bg-sun/5 transition-colors rounded-lg"
                >
                  <div className="col-span-2">
                    <span className="text-sm font-display font-bold">{row.stars}</span>
                    <span className="text-terra ml-1">&#9733;</span>
                    <div className="text-[10px] text-charcoal/30 mt-0.5">{row.label}</div>
                  </div>
                  <div className="col-span-2">
                    <span className={`font-mono text-sm font-semibold ${isPositive ? 'text-charcoal' : 'text-terra'}`}>{row.multiplier}%</span>
                  </div>
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="flex-1 h-3.5 bg-charcoal/[0.06] rounded-full overflow-hidden border-[1.5px] border-charcoal/10">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-700`}
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="font-mono text-sm font-bold text-charcoal">${payout}</span>
                  </div>
                  <div className="col-span-1 text-right">
                    <span className={`nb-tag text-[9px] py-0.5 px-2 ${isPositive ? 'bg-sage-light text-sage border-sage/30' : 'bg-terra-light text-terra border-terra/30'}`}>
                      {isPositive ? '+' : ''}{delta}%
                    </span>
                  </div>
                </div>
              )
            })}

            <div className="mt-5 pt-4 border-t-[2.5px] border-dashed border-charcoal/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="font-mono text-[11px] text-charcoal/35 leading-relaxed">
                Formula: <span className="text-charcoal/55 font-semibold">multiplier = 40 + (rating &times; 22) / 10</span>
                <span className="text-charcoal/25 ml-2">&middot;</span>
                <span className="ml-2">Rating stored as integer 10&ndash;50</span>
              </div>
              <a href="#architecture" className="font-mono text-[10px] text-terra hover:text-terra-dark transition-colors tracking-wider uppercase">
                View contracts &uarr;
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SECTION DIVIDER — ANTI-FRAUD ═══════════ */}
      <div className="relative z-10 bg-cream">
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20">
          <div className="border-t-[2.5px] border-charcoal/10" />
        </div>
        <div className="flex items-center justify-center -mt-4">
          <div className="bg-cream px-6 flex items-center gap-3">
            <div className="w-3 h-3 bg-terra rounded-full border-2 border-charcoal" />
            <span className="font-mono text-[10px] tracking-[0.25em] text-charcoal/30 uppercase font-medium">Anti-Fraud</span>
            <div className="w-3 h-3 bg-terra rounded-full border-2 border-charcoal" />
          </div>
        </div>
      </div>

      {/* ═══════════ ANTI-FRAUD ═══════════ */}
      <section id="fraud" className="relative z-10 bg-cream px-6 md:px-12 lg:px-20 pt-12 pb-24 md:pb-32">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
              Bad delivery?{' '}
              <span className="font-serif italic text-terra font-normal">Money talks.</span>
            </h2>
            <p className="text-charcoal/45 text-base max-w-xl mx-auto">
              No bans, no disputes. Lower rating = lower multiplier = less pay. The math self-corrects.
            </p>
          </div>

          {/* Side-by-side scenario cards */}
          <div className="grid md:grid-cols-2 gap-5 mb-8">
            {/* Good worker */}
            <div className="nb-card bg-white rounded-2xl p-6 shadow-brutal-sage relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-sage rounded-t-2xl" />
              <div className="flex items-center gap-2.5 mb-5 pt-1">
                <div className="w-8 h-8 bg-sage rounded-lg border-2 border-charcoal flex items-center justify-center">
                  <span className="text-white text-sm">&#9650;</span>
                </div>
                <span className="font-display text-sm font-bold uppercase tracking-wide">Good Worker</span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-sage-light rounded-xl p-3 border-2 border-sage/20 text-center">
                  <div className="font-mono text-[9px] tracking-widest text-charcoal/35 uppercase mb-1">Rating</div>
                  <div className="font-display text-2xl font-extrabold">4.5<span className="text-terra ml-0.5 text-sm">&#9733;</span></div>
                </div>
                <div className="bg-sage-light rounded-xl p-3 border-2 border-sage/20 text-center">
                  <div className="font-mono text-[9px] tracking-widest text-charcoal/35 uppercase mb-1">Multiplier</div>
                  <div className="font-display text-2xl font-extrabold text-sage">139%</div>
                </div>
                <div className="bg-sage-light rounded-xl p-3 border-2 border-sage/20 text-center">
                  <div className="font-mono text-[9px] tracking-widest text-charcoal/35 uppercase mb-1">Payout</div>
                  <div className="font-display text-2xl font-extrabold">$0.35</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t-2 border-dashed border-charcoal/8">
                <span className="nb-tag bg-sage-light text-sage border-sage/30 text-[9px]">+39% bonus per delivery</span>
              </div>
            </div>

            {/* Fraud scenario */}
            <div className="nb-card bg-white rounded-2xl p-6 shadow-brutal-terra relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-terra rounded-t-2xl" />
              <div className="flex items-center gap-2.5 mb-5 pt-1">
                <div className="w-8 h-8 bg-terra rounded-lg border-2 border-charcoal flex items-center justify-center">
                  <span className="text-white text-sm">&#9660;</span>
                </div>
                <span className="font-display text-sm font-bold uppercase tracking-wide">After Fraud</span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-terra-light rounded-xl p-3 border-2 border-terra/20 text-center">
                  <div className="font-mono text-[9px] tracking-widest text-charcoal/35 uppercase mb-1">Rating</div>
                  <div className="font-display text-2xl font-extrabold">2.0<span className="text-terra ml-0.5 text-sm">&#9733;</span></div>
                </div>
                <div className="bg-terra-light rounded-xl p-3 border-2 border-terra/20 text-center">
                  <div className="font-mono text-[9px] tracking-widest text-charcoal/35 uppercase mb-1">Multiplier</div>
                  <div className="font-display text-2xl font-extrabold text-terra">84%</div>
                </div>
                <div className="bg-terra-light rounded-xl p-3 border-2 border-terra/20 text-center">
                  <div className="font-mono text-[9px] tracking-widest text-charcoal/35 uppercase mb-1">Payout</div>
                  <div className="font-display text-2xl font-extrabold">$0.21</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t-2 border-dashed border-charcoal/8">
                <span className="nb-tag bg-terra-light text-terra border-terra/30 text-[9px]">&minus;$0.14 per delivery (&minus;39% cut)</span>
              </div>
            </div>
          </div>

          {/* Bottom row — principles */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: '&#9878;', title: 'No bans', desc: 'Economic penalty', shadow: 'shadow-brutal-sage', color: 'bg-sage' },
              { icon: '&#9881;', title: 'No disputes', desc: 'Math is arbiter', shadow: 'shadow-brutal-sun', color: 'bg-sun' },
              { icon: '&#8635;', title: 'Self-healing', desc: 'Good work restores', shadow: 'shadow-brutal-lavender', color: 'bg-lavender' },
            ].map((item) => (
              <div key={item.title} className={`nb-card bg-white rounded-xl p-5 ${item.shadow} text-center`}>
                <div className={`w-9 h-9 ${item.color} rounded-lg border-2 border-charcoal flex items-center justify-center mx-auto mb-3`}>
                  <span className="text-white text-sm" dangerouslySetInnerHTML={{ __html: item.icon }} />
                </div>
                <div className="font-display text-sm font-bold mb-0.5">{item.title}</div>
                <div className="font-mono text-[9px] text-charcoal/35 uppercase tracking-wider">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ WHY ALGORAND ═══════════ */}
      <section className="relative z-10 bg-cream px-6 md:px-12 lg:px-20 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-12 gap-12 items-start">
            <div className="md:col-span-4">
              <span className="nb-tag bg-sage-light text-sage border-sage/30 font-mono text-[9px] mb-4">Infrastructure</span>
              <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight mt-4 mb-4">
                Why{' '}
                <span className="font-serif italic text-terra font-normal">Algorand?</span>
              </h2>
              <p className="text-charcoal/45 text-base leading-relaxed max-w-sm">
                Gig payments need sub-cent fees and instant finality. Algorand
                settles in under 3 seconds for a fraction of a cent.
              </p>
            </div>

            <div className="md:col-span-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Finality', value: '~3s', note: 'Instant settlement', shadow: 'shadow-brutal-terra' },
                  { label: 'Tx Fee', value: '0.001', note: 'ALGO per txn', shadow: 'shadow-brutal-sage' },
                  { label: 'TPS', value: '10K+', note: 'Enterprise scale', shadow: 'shadow-brutal-sun' },
                  { label: 'Carbon', value: 'Neg.', note: 'Green blockchain', shadow: 'shadow-brutal-sage' },
                  { label: 'Uptime', value: '100%', note: 'Since genesis', shadow: 'shadow-brutal-terra' },
                  { label: 'Storage', value: 'Box', note: 'On-chain key-value', shadow: 'shadow-brutal-lavender' },
                ].map((item) => (
                  <div key={item.label} className={`nb-card bg-white rounded-xl p-5 ${item.shadow}`}>
                    <div className="font-mono text-[9px] tracking-widest text-charcoal/30 uppercase mb-3">{item.label}</div>
                    <div className="font-display text-2xl font-extrabold mb-1">{item.value}</div>
                    <div className="text-xs text-charcoal/40">{item.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ DARK: TECH STACK ══════════ */}
      <div className="bg-charcoal text-cream">
        <section className="relative z-10 px-6 md:px-12 lg:px-16 py-5">
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

      {/* ═══════════ CTA ═══════════ */}
      <section className="relative z-10 bg-cream px-6 md:px-12 lg:px-20 py-24 md:py-32">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-12 h-1 bg-terra rounded-full mx-auto mb-8" />
          <h2 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] mb-6">
            Stop running payroll{' '}
            <span className="font-serif italic text-terra font-normal">manually.</span>
          </h2>
          <p className="text-charcoal/45 text-lg mb-10 max-w-lg mx-auto text-balance">
            Your riders, drivers, and delivery partners deserve real-time pay
            tied to real performance. One atomic transaction. No spreadsheets.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/platform')}
              className="nb-btn bg-terra text-cream px-10 py-5 text-sm font-display font-bold tracking-widest uppercase"
            >
              Merchant Dashboard &rarr;
            </button>
            <button
              onClick={() => navigate('/worker')}
              className="nb-btn bg-cream text-charcoal px-10 py-5 text-sm font-display font-bold tracking-widest uppercase"
            >
              Worker Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="relative z-10 border-t-[2.5px] border-charcoal bg-cream px-6 md:px-12 lg:px-20 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <AloraLogo size="sm" />
            <span className="text-charcoal/25 text-xs ml-1">On-Chain Gig Payments</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] text-charcoal/30">
            <span>Built on Algorand</span>
            <span className="w-1.5 h-1.5 bg-charcoal/10 rounded-full" />
            <span>USDC Settlements</span>
            <span className="w-1.5 h-1.5 bg-charcoal/10 rounded-full" />
            <span>Atomic Transactions</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
