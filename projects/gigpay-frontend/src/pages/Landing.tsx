import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AloraLogo from '../components/shared/AloraLogo'

const STATS = [
  { value: '300M+', label: 'Gig workers in India without CIBIL', accent: 'bg-terra' },
  { value: '₹4.5L Cr', label: 'Untapped credit TAM', accent: 'bg-sun' },
  { value: '<3s', label: 'Underwriting decision via API', accent: 'bg-sage' },
  { value: '95%', label: 'Lower cost per underwrite', accent: 'bg-lavender' },
]

const AURA_LADDER = [
  {
    band: 'Building',
    range: '1–300',
    unlocks: ['Register on Alora', 'Receive first attestations', 'Build foundation'],
    accent: 'bg-terra',
    dot: 'bg-terra',
    text: 'text-terra',
  },
  {
    band: 'Fair',
    range: '301–550',
    unlocks: ['Salary advance up to ₹10K', 'BNPL eligibility', 'Insurance enrollment'],
    accent: 'bg-sun',
    dot: 'bg-sun',
    text: 'text-charcoal',
  },
  {
    band: 'Good',
    range: '551–700',
    unlocks: ['Personal loan ₹25–50K', 'Two-wheeler EMI at standard rates', 'Rent deposit waivers'],
    accent: 'bg-sage',
    dot: 'bg-sage',
    text: 'text-sage',
  },
  {
    band: 'Very Good',
    range: '701–850',
    unlocks: ['Personal loan ₹1–2L', 'Equipment finance', 'Credit line + lower rates'],
    accent: 'bg-lavender',
    dot: 'bg-lavender',
    text: 'text-charcoal',
  },
  {
    band: 'Excellent',
    range: '851–1000',
    unlocks: ['Mortgage-grade record', 'Premium insurance', 'Cross-border portability'],
    accent: 'bg-charcoal',
    dot: 'bg-charcoal',
    text: 'text-charcoal',
  },
]

const FI_DATA_POINTS = [
  {
    name: 'Aura Score',
    type: 'uint16',
    desc: '1–1000, CIBIL-shaped. Plug-and-play in existing underwriting rules.',
    replaces: 'CIBIL Score',
  },
  {
    name: 'Verified Monthly Income',
    type: 'object',
    desc: 'Derived from payment-proof attestations. Mean, median, 12-month variance, distinct payers.',
    replaces: 'Salary slip',
  },
  {
    name: 'Income Stability Index',
    type: 'uint8',
    desc: 'Composite of recency × diversification × tenure. One number for income reliability.',
    replaces: 'Form 16 / ITR',
  },
  {
    name: 'Trust Signal Pack',
    type: 'object',
    desc: 'Distinct issuers, vouch count, revocation rate, verified-business issuer ratio.',
    replaces: 'Reference check',
  },
  {
    name: 'Attestation Feed',
    type: 'array',
    desc: 'Raw on-chain records, consent-gated. For deep due-diligence on flagged cases.',
    replaces: 'Employment letter',
  },
]

const FI_PARTNERS = [
  { name: 'Shriram Finance', tag: 'NBFC' },
  { name: 'Capital Float', tag: 'NBFC' },
  { name: 'KreditBee', tag: 'NBFC' },
  { name: 'Lendingkart', tag: 'NBFC' },
  { name: 'Freo', tag: 'Credit Line' },
  { name: 'Niyo', tag: 'Neo-bank' },
  { name: 'Jupiter', tag: 'Neo-bank' },
  { name: 'Fi Money', tag: 'Neo-bank' },
]

const ATTESTATION_CATEGORIES = [
  {
    name: 'Work Event',
    code: 1,
    examples: 'Shifts, deliveries, projects',
    desc: 'A discrete unit of work performed and verified by an issuer.',
    accent: 'bg-sage',
    text: 'text-sage',
  },
  {
    name: 'Skill',
    code: 2,
    examples: 'Certifications, demonstrated abilities',
    desc: 'A capability claim — verified by a trainer, employer, or peer.',
    accent: 'bg-sun',
    text: 'text-charcoal',
  },
  {
    name: 'Payment Proof',
    code: 3,
    examples: 'Earned income, settled invoices',
    desc: 'On-chain or off-chain evidence of compensation received.',
    accent: 'bg-terra',
    text: 'text-terra',
  },
  {
    name: 'Vouch',
    code: 4,
    examples: 'Peer endorsements, references',
    desc: 'A weighted endorsement from another verified actor.',
    accent: 'bg-lavender',
    text: 'text-charcoal',
  },
  {
    name: 'Other',
    code: 5,
    examples: 'Domain-specific extensions',
    desc: "Free-form claims for use cases the canonical schema doesn't cover.",
    accent: 'bg-charcoal',
    text: 'text-charcoal',
  },
]

const TECH_STACK = [
  'Algorand AVM',
  'PuyaPy Smart Contracts',
  'ARC-56 App Specs',
  'AlgoKit Utils',
  'Box Storage',
  'IPFS / Encrypted Vault',
  'Hono Read API',
  'React + TypeScript',
  'use-wallet',
]

const FLOW_STEPS = [
  {
    step: '01',
    title: 'Worker registers their wallet',
    detail:
      'One-time signup: connect Pera/Defly + verify a phone number. Phone hash maps to wallet address — sybil anchor without storing PII.',
    tag: 'IDENTITY',
    dot: 'bg-sage',
  },
  {
    step: '02',
    title: 'Any issuer attests to work',
    detail:
      'A hotel manager, freelance client, film producer, or training institute issues a signed attestation: who, what, when. Free, frictionless, on-chain.',
    tag: 'ISSUE',
    dot: 'bg-sun',
  },
  {
    step: '03',
    title: 'Records stay encrypted by default',
    detail:
      'On-chain holds only metadata + content pointer. The claim itself sits encrypted in the worker-owned vault. No PII visible to the public.',
    tag: 'PRIVACY',
    dot: 'bg-lavender',
  },
  {
    step: '04',
    title: 'Worker grants access on demand',
    detail: 'A lender, insurer, or new employer requests access. Worker reviews scope and signs a per-consumer grant. Revocable any time.',
    tag: 'CONSENT',
    dot: 'bg-terra',
  },
  {
    step: '05',
    title: 'Consumer queries the read API',
    detail:
      'Subscription-gated, grant-verified. Returns structured attestations + issuer metadata. Consumers compute their own scores. Alora is never opinionated.',
    tag: 'QUERY',
    dot: 'bg-charcoal',
  },
]

const CONTRACTS = [
  {
    name: 'WorkerRegistry',
    appId: import.meta.env.VITE_WORKER_REGISTRY_APP_ID,
    tag: 'IDENTITY',
    desc: 'Maps phone-hash to wallet address. Sybil anchor with zero PII on-chain. Workers register once with a verified phone and connected wallet.',
    methods: ['register_worker', 'update_handle', 'lookup_by_phone_hash', 'get_worker_info'],
    storage: 'Box: wkr_{address} → ~64B',
    accent: 'bg-sage',
  },
  {
    name: 'AttestationLog',
    appId: import.meta.env.VITE_ATTESTATION_LOG_APP_ID,
    tag: 'ATTESTATIONS',
    desc: 'Canonical attestation entries. Fixed core fields + content pointer to the encrypted off-chain vault. Generic across domains and geographies.',
    methods: ['issue_attestation', 'revoke_attestation', 'get_attestation', 'list_by_subject'],
    storage: 'Box: att_{id} → ~120B',
    accent: 'bg-terra',
  },
  {
    name: 'AccessGrants',
    appId: import.meta.env.VITE_ACCESS_GRANTS_APP_ID,
    tag: 'CONSENT',
    desc: 'Per-consumer access grants from workers. Scope, expiry, query limits. Read API enforces grants on every query — no grant, no data.',
    methods: ['grant_access', 'revoke_access', 'check_grant'],
    storage: 'Box: gnt_{worker}_{consumer} → ~80B',
    accent: 'bg-sun',
  },
]

const ALGO_FACTS = [
  { label: 'Finality', value: '~3s', note: 'Instant settlement' },
  { label: 'Tx Fee', value: '0.001', note: 'ALGO per txn' },
  { label: 'TPS', value: '10K+', note: 'Enterprise scale' },
  { label: 'Carbon', value: 'Neg.', note: 'Green blockchain' },
  { label: 'Uptime', value: '100%', note: 'Since genesis' },
  { label: 'Storage', value: 'Box', note: 'On-chain key-value' },
]

// Hero Aura Score gauge geometry
const GAUGE_R = 112
const GAUGE_C = 2 * Math.PI * GAUGE_R

/** Small eyebrow + heading block used to give each section its own identity. */
const SectionLabel: React.FC<{ children: React.ReactNode; dot?: string }> = ({ children, dot = 'bg-terra' }) => (
  <div className="flex items-center gap-2.5">
    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
    <span className="a-eyebrow">{children}</span>
  </div>
)

const Landing: React.FC = () => {
  const [mounted, setMounted] = useState(false)
  const [appMenuOpen, setAppMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [score, setScore] = useState(0)
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Count-up animation for the hero Aura Score gauge
  useEffect(() => {
    const target = 712
    const duration = 1800
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3) // easeOutCubic
      setScore(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!appMenuOpen) return
    const close = () => setAppMenuOpen(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [appMenuOpen])

  // Scroll-reveal for [.a-reveal] elements
  useEffect(() => {
    const els = rootRef.current?.querySelectorAll<HTMLElement>('.a-reveal')
    if (!els || !els.length) return
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in-view'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in-view')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const goDemo = () => {
    const demo = import.meta.env.VITE_DEMO_WORKER_ADDRESS as string
    if (demo) navigate(`/w/${demo}`)
    else navigate('/worker')
  }

  // Live gauge values, driven by the count-up animation
  const frac = score / 1000
  const dashoffset = GAUGE_C * (1 - frac)
  // angle in the SVG's own space (the <svg> element is rotated -90deg, which
  // visually shifts the 3-o'clock origin to the top)
  const knobAngle = 360 * frac * (Math.PI / 180)
  const knobX = 130 + GAUGE_R * Math.cos(knobAngle)
  const knobY = 130 + GAUGE_R * Math.sin(knobAngle)

  return (
    <div ref={rootRef} className="min-h-screen font-sans relative overflow-x-hidden bg-cream text-charcoal">
      <div className="noise-overlay" />

      {/* ═══════════ NAV ═══════════ */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-cream/85 backdrop-blur-md border-b border-charcoal/10' : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-10 lg:px-14 py-4">
          <AloraLogo size="md" />
          <div className="flex items-center gap-7">
            <a href="#flow" className="text-sm font-medium text-charcoal/55 hover:text-charcoal transition-colors hidden md:block">
              Flow
            </a>
            <a href="#ladder" className="text-sm font-medium text-charcoal/55 hover:text-charcoal transition-colors hidden md:block">
              Ladder
            </a>
            <a href="#partners" className="text-sm font-semibold text-terra hover:text-terra-dark transition-colors hidden md:block">
              For Partners
            </a>
            <a href="#architecture" className="text-sm font-medium text-charcoal/55 hover:text-charcoal transition-colors hidden lg:block">
              Architecture
            </a>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setAppMenuOpen((v) => !v)
                }}
                className="a-btn a-btn-dark !px-5 !py-2.5 !text-[13px]"
              >
                Launch App
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${appMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {appMenuOpen && (
                <div className="absolute right-0 top-full mt-3 w-64 bg-white border border-charcoal/10 rounded-2xl shadow-[0_24px_60px_-24px_rgba(26,26,26,0.4)] overflow-hidden z-50">
                  {[
                    { to: '/worker', k: 'W', name: 'Worker', sub: 'View attestations, grant access', bg: 'bg-sage', hover: 'hover:bg-sage/5', hoverText: 'group-hover:text-sage' },
                    { to: '/issuer', k: 'I', name: 'Issuer', sub: 'Attest to work or skills', bg: 'bg-terra', hover: 'hover:bg-terra/5', hoverText: 'group-hover:text-terra' },
                    { to: '/consumer', k: 'C', name: 'Consumer', sub: 'Query attestations via API', bg: 'bg-sun', hover: 'hover:bg-sun/10', hoverText: 'group-hover:text-charcoal' },
                  ].map((item, i, arr) => (
                    <button
                      key={item.to}
                      onClick={() => navigate(item.to)}
                      className={`w-full text-left px-5 py-3.5 ${item.hover} transition-colors ${i < arr.length - 1 ? 'border-b border-charcoal/8' : ''} group`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${item.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <span className={`${item.k === 'C' ? 'text-charcoal' : 'text-cream'} text-xs font-bold`}>{item.k}</span>
                        </div>
                        <div>
                          <div className={`font-display text-sm font-bold ${item.hoverText} transition-colors`}>{item.name}</div>
                          <div className="text-[12px] text-charcoal/45">{item.sub}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative z-10 px-6 md:px-10 lg:px-14 pt-12 md:pt-16 pb-16 md:pb-20 overflow-hidden">
        {/* atmosphere */}
        <div className="absolute top-1/2 right-[-10%] -translate-y-1/2 w-[60rem] h-[60rem] a-glow pointer-events-none" />
        {/* oversized serif watermark */}
        <div
          aria-hidden
          className="absolute -left-6 bottom-[18%] font-serif italic text-terra/[0.04] text-[34vw] leading-none pointer-events-none select-none hidden lg:block"
        >
          aura
        </div>

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-12 gap-y-14 lg:gap-x-8 items-center min-h-[78vh] pt-6">
          {/* Left — editorial headline */}
          <div className={`lg:col-span-7 ${mounted ? 'animate-fade-up' : 'opacity-0'}`}>

            <h1 className="font-serif font-normal leading-[0.92] tracking-[-0.02em] text-[clamp(3rem,8vw,7rem)]">
              Credit Bureau
              <br />
              <span className="relative inline-block italic text-terra">
                informal economy
                <svg className="absolute -bottom-1 left-0 w-full" height="12" viewBox="0 0 300 10" preserveAspectRatio="none">
                  <path d="M1 6 Q75 1 150 5 T299 5" stroke="#c44b2b" strokeWidth="2.5" fill="none" opacity="0.7" strokeLinecap="round" />
                </svg>
              </span>
              <br />
              never had.
            </h1>

            <p className="text-charcoal text-lg md:text-xl max-w-xl leading-relaxed mt-9 mb-9 pl-5 border-l-2 border-terra/30">
              NBFCs and neo-banks query Alora to underwrite the <span className="font-semibold">300M Indians</span>{' '}
              without salary slips, ITRs, or EPFO numbers. Workers own the record. Lenders pay per query.{' '}
              <span className="font-semibold">The money flows through partners we don't touch it.</span>
            </p>

            <div className="flex flex-wrap items-center gap-3.5">
              <button onClick={goDemo} className="a-btn a-btn-primary">
                Try the Demo →
              </button>
              <a href="#partners" className="a-btn a-btn-dark">
                For Partners
              </a>
              <button onClick={() => navigate('/worker')} className="a-btn a-btn-ghost">
                I'm a Worker
              </button>
            </div>
          </div>

          {/* Right — signature Aura Score gauge */}
          <div className={`lg:col-span-5 flex justify-center lg:justify-end ${mounted ? 'animate-fade-up-delay-2' : 'opacity-0'}`}>
            <div className="relative w-[330px] sm:w-[400px] aspect-square">
              {/* soft halo */}
              <div className="absolute inset-6 rounded-full bg-white/50 blur-2xl" />
              <div className="absolute inset-0 a-glow" />

              {/* gauge */}
              <svg viewBox="0 0 260 260" className="relative w-full h-full -rotate-90 drop-shadow-[0_30px_50px_rgba(26,26,26,0.12)]">
                {/* tick ring */}
                {Array.from({ length: 60 }).map((_, i) => {
                  const a = (i / 60) * 2 * Math.PI
                  const inner = 132
                  const outer = i % 5 === 0 ? 142 : 138
                  return (
                    <line
                      key={i}
                      x1={130 + inner * Math.cos(a)}
                      y1={130 + inner * Math.sin(a)}
                      x2={130 + outer * Math.cos(a)}
                      y2={130 + outer * Math.sin(a)}
                      stroke="#1a1a1a"
                      strokeWidth={i % 5 === 0 ? 1.4 : 0.8}
                      opacity={i / 60 <= frac ? 0.35 : 0.1}
                    />
                  )
                })}
                {/* track */}
                <circle cx="130" cy="130" r={GAUGE_R} fill="none" stroke="#1a1a1a" strokeOpacity="0.08" strokeWidth="10" />
                {/* progress */}
                <circle
                  cx="130"
                  cy="130"
                  r={GAUGE_R}
                  fill="none"
                  stroke="#c44b2b"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={GAUGE_C}
                  strokeDashoffset={dashoffset}
                />
                {/* knob */}
                <circle cx={knobX} cy={knobY} r="8" fill="#c44b2b" />
                <circle cx={knobX} cy={knobY} r="3.5" fill="#f5f0e8" />
              </svg>

              {/* center read-out */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="a-eyebrow mb-1.5">Aura Score</span>
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-6xl sm:text-7xl font-extrabold text-charcoal tabular-nums leading-none">{score}</span>
                  <span className="font-mono text-sm text-charcoal/30">/1000</span>
                </div>
                <div className="mt-3 a-chip !py-1.5 !px-3 !bg-terra/10 !border-terra/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-terra" />
                  <span className="font-mono text-[11px] tracking-[0.06em] uppercase text-terra font-semibold">Very Good</span>
                </div>
              </div>

              {/* floating attestation proofs */}
              {[
                { label: 'Payment Proof', dot: 'bg-terra', pos: 'top-2 -left-3 sm:-left-6', delay: 'animate-fade-up-delay-1' },
                { label: 'Work Event', dot: 'bg-sage', pos: 'top-10 -right-2 sm:-right-8', delay: 'animate-fade-up-delay-2' },
                { label: 'Skill', dot: 'bg-sun', pos: 'bottom-12 -left-2 sm:-left-10', delay: 'animate-fade-up-delay-3' },
                { label: 'Vouch', dot: 'bg-lavender', pos: 'bottom-3 right-0 sm:-right-4', delay: 'animate-fade-up-delay-3' },
              ].map((p) => (
                <div
                  key={p.label}
                  className={`absolute ${p.pos} ${mounted ? p.delay : 'opacity-0'} a-chip !py-1.5 !px-3 shadow-[0_10px_30px_-12px_rgba(26,26,26,0.3)]`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
                  <span className="font-display text-[12px] font-bold text-charcoal">{p.label}</span>
                  <svg className="w-3 h-3 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* ═══════════ STAT LEDGER — dark band ═══════════ */}
      <div className="relative z-10 bg-charcoal text-cream a-bleed">
        <div className="absolute inset-0 grid-lines opacity-[0.06] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {STATS.map((stat, i) => (
              <div
                key={i}
                className={`p-6 md:p-8 flex flex-col items-center text-center ${i % 2 === 1 ? 'border-l border-cream/12' : ''} ${
                  i !== 0 ? 'md:border-l md:border-cream/12' : ''
                } ${i < 2 ? 'border-b border-cream/12 md:border-b-0' : ''}`}
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span className={`w-1.5 h-1.5 ${stat.accent} rounded-full`} />
                  <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-cream/40">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div className="font-display text-3xl md:text-[2.5rem] font-extrabold text-cream leading-none mb-2.5">{stat.value}</div>
                <div className="text-[13px] text-cream/50 font-medium leading-snug">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════ FLOW — connected timeline ═══════════ */}
      <section id="flow" className="relative z-10 bg-cream px-6 md:px-10 lg:px-14 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          <div className="a-reveal max-w-2xl mb-16">
            <SectionLabel dot="bg-sun">How it works</SectionLabel>
            <h2 className="font-serif text-[2.7rem] md:text-6xl font-normal tracking-[-0.015em] mt-5 mb-4 leading-[1.02]">
              From signup to a <span className="font-serif italic text-terra">verifiable record</span>
            </h2>
            <p className="text-charcoal/50 text-base md:text-lg leading-relaxed">
              A worker's reputation goes from invisible to portable in five steps. No payments, no escrow — just signed claims, owned by the
              worker, queryable by consent.
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* connecting rail */}
            <div className="hidden md:block absolute top-[14px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-charcoal/15 to-transparent" />
            <div className="md:hidden absolute top-0 bottom-0 left-[13px] w-px bg-charcoal/12" />

            <div className="grid md:grid-cols-5 gap-x-6 gap-y-9">
              {FLOW_STEPS.map((item, i) => (
                <div
                  key={item.step}
                  className="a-reveal relative pl-10 md:pl-0"
                  style={{ transitionDelay: `${i * 70}ms` }}
                >
                  {/* node */}
                  <div className="absolute md:static left-0 top-0 md:mb-6 flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full ${item.dot} ring-4 ring-cream flex items-center justify-center shrink-0`}>
                      <span className={`font-mono text-[11px] font-bold ${item.dot === 'bg-sun' ? 'text-charcoal' : 'text-cream'}`}>{i + 1}</span>
                    </div>
                  </div>
                  <span className="a-eyebrow block mb-2.5">{item.tag}</span>
                  <h3 className="font-display text-[15px] font-bold mb-2 leading-snug">{item.title}</h3>
                  <p className="text-charcoal/50 text-[13px] leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ ARCHITECTURE — dark section ═══════════ */}
      <section id="architecture" className="relative z-10 bg-charcoal text-cream a-bleed">
        <div className="absolute inset-0 grid-lines opacity-[0.07] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 md:px-10 lg:px-14 py-24 md:py-32">
          <div className="a-reveal flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div className="max-w-xl">
              <SectionLabel dot="bg-terra">
                <span className="text-cream/70">Protocol Architecture</span>
              </SectionLabel>
              <h2 className="font-serif text-[2.7rem] md:text-6xl font-normal tracking-[-0.015em] mt-5 leading-[1.02]">
                Three contracts, <span className="font-serif italic text-terra">one open protocol</span>
              </h2>
            </div>
            <span className="a-chip !bg-white/5 !border-cream/15 !text-cream/60 font-mono text-[11px] shrink-0">
              Algorand TestNet · Open Standard Candidate
            </span>
          </div>

          {/* Contract cards */}
          <div className="grid md:grid-cols-3 gap-5 mb-6">
            {CONTRACTS.map((contract, i) => (
              <div
                key={contract.name}
                className="a-reveal a-card-dark p-7 group"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${contract.accent}`} />
                    <h3 className="font-display text-lg font-bold text-cream">{contract.name}</h3>
                  </div>
                  <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-cream/35">{contract.tag}</span>
                </div>

                <p className="text-cream/50 text-[13px] leading-relaxed mb-5">{contract.desc}</p>

                <div className="flex flex-wrap gap-1.5 mb-5">
                  {contract.methods.map((m) => (
                    <span key={m} className="font-mono text-[11px] bg-white/5 text-cream/55 px-2 py-1 rounded-md border border-cream/10">
                      {m}()
                    </span>
                  ))}
                </div>

                <div className="pt-4 border-t border-cream/10 flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-cream/35">{contract.storage}</span>
                  {contract.appId && (
                    <a
                      href={`https://testnet.explorer.perawallet.app/application/${contract.appId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] text-terra hover:text-terra-light transition-colors whitespace-nowrap"
                    >
                      app {contract.appId} ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Query pipeline */}
          <div className="a-reveal a-card-dark p-7 md:p-9">
            <div className="flex items-center gap-3 mb-7">
              <span className="w-2.5 h-2.5 rounded-full bg-terra" />
              <span className="font-display text-sm font-bold uppercase tracking-[0.06em] text-cream/80">Read API · Grant-Verified Query</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-0">
              {[
                { num: '1', contract: 'Read API', method: 'verify_subscription()', dot: 'bg-terra' },
                { num: '2', contract: 'AccessGrants', method: 'check_grant()', dot: 'bg-sun' },
                { num: '3', contract: 'AttestationLog', method: 'list_by_subject()', dot: 'bg-lavender' },
                { num: '4', contract: 'Vault', method: 'decrypt_payload()', dot: 'bg-sage' },
              ].map((txn, i) => (
                <div key={i} className="relative md:px-5 md:first:pl-0 md:last:pr-0">
                  <div className="md:border-l md:first:border-l-0 md:border-cream/10 md:pl-5 md:first:pl-0">
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className={`w-6 h-6 rounded-full ${txn.dot} flex items-center justify-center`}>
                        <span className={`font-mono text-[11px] font-bold ${txn.dot === 'bg-sun' ? 'text-charcoal' : 'text-cream'}`}>{txn.num}</span>
                      </span>
                      {i < 3 && <span className="hidden md:inline text-cream/25 ml-auto">→</span>}
                    </div>
                    <div className="font-mono text-[11px] text-cream/45 mb-1">{txn.contract}</div>
                    <div className="font-mono text-[11px] text-terra font-semibold">{txn.method}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7 pt-5 border-t border-cream/10 flex flex-wrap items-center gap-6">
              {[
                { color: 'bg-sage', text: 'No grant, no data' },
                { color: 'bg-terra', text: 'Subscription-gated' },
                { color: 'bg-sun', text: 'Worker can revoke any time' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 ${item.color} rounded-full`} />
                  <span className="text-[12px] text-cream/45 font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ CATEGORIES — editorial list ═══════════ */}
      <section id="categories" className="relative z-10 bg-cream px-6 md:px-10 lg:px-14 py-24 md:py-32">
        <div className="max-w-5xl mx-auto">
          <div className="a-reveal max-w-2xl mb-14">
            <SectionLabel dot="bg-lavender">Attestation Schema</SectionLabel>
            <h2 className="font-serif text-[2.7rem] md:text-6xl font-normal tracking-[-0.015em] mt-5 mb-4 leading-[1.02]">
              Five categories, <span className="font-serif italic text-terra">one substrate</span>
            </h2>
            <p className="text-charcoal/50 text-base md:text-lg leading-relaxed">
              The canonical schema is intentionally minimal. Domain-specific structure (industry, role, rating shape) lives in the encrypted
              payload — consumers parse what they need.
            </p>
          </div>

          <div className="border-t border-charcoal/10">
            {ATTESTATION_CATEGORIES.map((cat, i) => (
              <div
                key={cat.code}
                className="a-reveal group grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-baseline py-7 border-b border-charcoal/10 transition-colors hover:bg-white/40 -mx-4 px-4 rounded-xl"
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                <div className="md:col-span-1 flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${cat.accent}`} />
                  <span className="font-serif italic text-2xl text-charcoal/30">{String(cat.code).padStart(2, '0')}</span>
                </div>
                <div className="md:col-span-3">
                  <h3 className="font-display text-xl font-bold group-hover:text-terra transition-colors">{cat.name}</h3>
                  <span className="font-mono text-[11px] text-charcoal/35">category = {cat.code}</span>
                </div>
                <p className="md:col-span-5 text-charcoal/55 text-[14px] leading-relaxed">{cat.desc}</p>
                <div className="md:col-span-3 md:text-right">
                  <span className="font-mono text-[12px] text-charcoal/40">{cat.examples}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ AURA LADDER ═══════════ */}
      <section id="ladder" className="relative z-10 bg-white a-bleed">
        <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-14 py-24 md:py-32">
          <div className="a-reveal text-center max-w-2xl mx-auto mb-16">
            <div className="flex justify-center">
              <SectionLabel dot="bg-terra">Financial Ladder</SectionLabel>
            </div>
            <h2 className="font-serif text-[2.7rem] md:text-6xl lg:text-7xl font-normal tracking-[-0.015em] mt-5 mb-4 leading-[1.02]">
              From invisible to <span className="font-serif italic text-terra">bankable.</span>
            </h2>
            <p className="text-charcoal/50 text-base md:text-lg leading-relaxed">
              The Aura Score is a single number, 1–1000, that lenders underwrite from. Each band unlocks specific financial products. The math
              is open; the path is concrete.
            </p>
          </div>

          {/* gradient progress rail */}
          <div className="a-reveal relative mb-10 hidden md:block">
            <div className="h-1.5 rounded-full overflow-hidden flex">
              <div className="flex-1 bg-terra" />
              <div className="flex-1 bg-sun" />
              <div className="flex-1 bg-sage" />
              <div className="flex-1 bg-lavender" />
              <div className="flex-1 bg-charcoal" />
            </div>
            <div className="flex justify-between mt-3 font-mono text-[11px] text-charcoal/30">
              <span>1</span>
              <span>1000</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {AURA_LADDER.map((tier, i) => (
              <div
                key={tier.band}
                className="a-reveal a-card a-card-hover p-5 flex flex-col"
                style={{ transitionDelay: `${i * 60}ms`, marginTop: `calc(${(AURA_LADDER.length - 1 - i) * 14}px)` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-charcoal/35">Tier {i + 1}</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${tier.dot}`} />
                </div>
                <h3 className="font-display text-xl font-extrabold text-charcoal leading-none">{tier.band}</h3>
                <span className={`font-mono text-[12px] font-semibold mt-1.5 ${tier.text}`}>{tier.range}</span>
                <div className="my-4 border-t border-charcoal/10" />
                <ul className="space-y-2 flex-1">
                  {tier.unlocks.map((u) => (
                    <li key={u} className="flex items-start gap-2 text-[12px] text-charcoal/60 leading-relaxed">
                      <span className={`w-1 h-1 ${tier.dot} rounded-full mt-1.5 shrink-0`} />
                      <span>{u}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="a-reveal mt-10 text-center text-[12px] font-mono text-charcoal/35 max-w-2xl mx-auto leading-relaxed">
            Unlocks shown are reference scenarios negotiated with pilot partners. Each NBFC sets its own thresholds and product mix. Alora
            exposes the data — they own the decision.
          </p>
        </div>
      </section>

      {/* ═══════════ FOR PARTNERS ═══════════ */}
      <section id="partners" className="relative z-10 bg-cream px-6 md:px-10 lg:px-14 py-24 md:py-32">
        <div className="max-w-6xl mx-auto">
          <div className="a-reveal flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-xl">
              <SectionLabel dot="bg-sage">For NBFCs · Neo-banks · Insurers</SectionLabel>
              <h2 className="font-serif text-[2.7rem] md:text-6xl font-normal tracking-[-0.015em] mt-5 mb-4 leading-[1.02]">
                Five data points, <span className="font-serif italic text-terra">one API.</span>
              </h2>
              <p className="text-charcoal/55 text-base md:text-lg leading-relaxed">
                Decision-ready data points your underwriting engine can ingest in seconds. Each one replaces a traditional document
                informal-economy workers can't produce. Consent-gated, queryable per worker, billed per call.
              </p>
            </div>
            <span className="a-chip font-mono text-[11px] text-charcoal/50 shrink-0">REST + GraphQL</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FI_DATA_POINTS.map((dp, i) => (
              <div key={dp.name} className="a-reveal a-card a-card-hover p-6" style={{ transitionDelay: `${i * 50}ms` }}>
                <div className="flex items-start justify-between mb-4">
                  <span className="font-serif italic text-2xl text-charcoal/25">{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-mono text-[11px] bg-sage-light text-sage px-2.5 py-1 rounded-full">{dp.type}</span>
                </div>
                <h3 className="font-display text-lg font-bold text-charcoal mb-2">{dp.name}</h3>
                <p className="text-charcoal/55 text-[13px] leading-relaxed mb-5">{dp.desc}</p>
                <div className="pt-4 border-t border-charcoal/10 flex items-center justify-between">
                  <span className="font-mono text-[11px] tracking-[0.08em] uppercase text-charcoal/35">Replaces</span>
                  <span className="font-mono text-[12px] text-terra font-semibold">{dp.replaces}</span>
                </div>
              </div>
            ))}

            {/* Sample JSON card */}
            <div className="a-reveal rounded-[22px] bg-charcoal text-cream p-6 relative overflow-hidden" style={{ transitionDelay: '250ms' }}>
              <div className="flex items-start justify-between mb-4">
                <span className="font-mono text-[11px] tracking-[0.08em] uppercase text-cream/45">Sample Response</span>
                <span className="font-mono text-[11px] bg-white/8 text-cream/65 px-2.5 py-1 rounded-full border border-cream/10">GET /v1/score</span>
              </div>
              <pre className="font-mono text-[12px] text-cream/75 leading-relaxed overflow-x-auto whitespace-pre">{`{
  "address": "XXTW...IGFU",
  "aura_score": 712,
  "band": "Very Good",
  "verified_monthly_income": {
    "mean": 14250,
    "variance": 0.08,
    "distinct_payers": 3
  },
  "stability_index": 78,
  "tenure_months": 14
}`}</pre>
              <a
                href="/sandbox"
                className="mt-4 inline-flex items-center gap-1.5 font-mono text-[12px] tracking-[0.08em] uppercase text-terra hover:text-terra-light transition-colors"
              >
                Try this live in the sandbox ↗
              </a>
            </div>
          </div>

          {/* Sandbox CTA */}
          <div className="a-reveal mt-5 rounded-[22px] bg-charcoal text-cream p-7 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-72 h-72 a-glow pointer-events-none" />
            <div className="relative">
              <span className="a-chip !bg-white/8 !border-cream/15 !text-cream/65 text-[11px] mb-3">No auth · No signup</span>
              <h3 className="font-display text-xl md:text-2xl font-bold">Test the bureau API live</h3>
              <p className="text-cream/55 text-sm mt-1.5 max-w-md">
                Paste any worker address. See the JSON your engine will receive. Get curl / Python / JS snippets.
              </p>
            </div>
            <a href="/sandbox" className="a-btn a-btn-primary relative shrink-0">
              Open Sandbox →
            </a>
          </div>

          {/* Pricing */}
          <div className="a-reveal mt-12 grid md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-5">
              <SectionLabel dot="bg-terra">Pricing</SectionLabel>
              <h3 className="font-serif text-3xl md:text-4xl font-normal tracking-[-0.01em] mt-4 mb-3">
                Pay-per-query, <span className="font-serif italic text-terra">no take-rate.</span>
              </h3>
              <p className="text-charcoal/50 text-[14px] leading-relaxed max-w-sm">
                We're a bureau, not a lender. Per-query keeps us out of financial-operator regulation; you keep 100% of the spread on the loans
                you write.
              </p>
            </div>
            <div className="md:col-span-7 grid grid-cols-3 gap-3">
              {[
                { label: 'Pilot', price: 'Free', sub: '100 queries/mo' },
                { label: 'Growth', price: '₹20', sub: '/ query' },
                { label: 'Enterprise', price: '₹2L+', sub: '/ month' },
              ].map((t, i) => (
                <div
                  key={t.label}
                  className={`a-card a-card-hover p-5 text-center ${i === 1 ? 'ring-1 ring-terra/30' : ''}`}
                >
                  <div className="font-mono text-[11px] tracking-[0.08em] uppercase text-charcoal/40 mb-2">{t.label}</div>
                  <div className="font-display text-2xl font-extrabold text-charcoal leading-none">{t.price}</div>
                  <div className="font-mono text-[12px] text-charcoal/40 mt-1.5">{t.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Partners */}
          <div className="a-reveal mt-16">
            <div className="text-center mb-6">
              <span className="a-eyebrow">Pilot Conversations</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {FI_PARTNERS.map((p) => (
                <div key={p.name} className="a-chip">
                  <span className="w-1.5 h-1.5 bg-terra rounded-full" />
                  <span className="font-display text-[13px] font-bold text-charcoal">{p.name}</span>
                  <span className="font-mono text-[10px] tracking-[0.08em] text-charcoal/35 uppercase">· {p.tag}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-center text-[12px] font-mono text-charcoal/35 max-w-2xl mx-auto leading-relaxed">
              Logos shown represent pilot-stage outreach. No formal partnership claimed at this stage — production integrations land alongside
              the Phase 5 read-API gateway.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ WHY ALGORAND ═══════════ */}
      <section className="relative z-10 bg-white a-bleed">
        <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-14 py-24 md:py-32">
          <div className="grid md:grid-cols-12 gap-12 items-start">
            <div className="md:col-span-4 a-reveal">
              <SectionLabel dot="bg-sage">Infrastructure</SectionLabel>
              <h2 className="font-serif text-[2.7rem] md:text-6xl font-normal tracking-[-0.015em] mt-5 mb-4 leading-[1.02]">
                Why <span className="font-serif italic text-terra">Algorand?</span>
              </h2>
              <p className="text-charcoal/50 text-base leading-relaxed max-w-sm">
                Reputation infrastructure needs cheap writes (every shift, every project, every skill) and instant reads. Algorand settles in
                under 3 seconds at sub-cent fees, with box storage that scales to billions of attestations.
              </p>
            </div>

            <div className="md:col-span-8">
              <div className="grid grid-cols-2 md:grid-cols-3 border-t border-l border-charcoal/10">
                {ALGO_FACTS.map((item, i) => (
                  <div
                    key={item.label}
                    className="a-reveal group p-6 border-b border-r border-charcoal/10 transition-colors hover:bg-cream/60"
                    style={{ transitionDelay: `${i * 50}ms` }}
                  >
                    <div className="font-mono text-[11px] tracking-[0.1em] text-charcoal/30 uppercase mb-3">{item.label}</div>
                    <div className="font-display text-3xl font-extrabold mb-1 group-hover:text-terra transition-colors">{item.value}</div>
                    <div className="text-[12px] text-charcoal/40">{item.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ TECH STACK — dark band ══════════ */}
      <div className="bg-charcoal text-cream a-bleed">
        <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 lg:px-14 py-12">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-px bg-terra" />
            <span className="font-mono text-[11px] tracking-[0.1em] text-cream/45 uppercase">Tech Stack</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {TECH_STACK.map((tech) => (
              <span
                key={tech}
                className="font-mono text-[12px] text-cream/55 border border-cream/12 rounded-full px-4 py-2 hover:border-terra/50 hover:text-terra transition-colors"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>
      </div>

      {/* ═══════════ CTA ═══════════ */}
      <section className="relative z-10 bg-cream px-6 md:px-10 lg:px-14 py-28 md:py-36">
        <div className="absolute inset-0 grid-dots opacity-50 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center a-reveal">
          <div className="w-10 h-1 bg-terra rounded-full mx-auto mb-8" />
          <h2 className="font-serif text-[2.9rem] md:text-7xl font-normal tracking-[-0.015em] leading-[1.02] mb-6">
            Underwrite the next <span className="font-serif italic text-terra">300 million.</span>
          </h2>
          <p className="text-charcoal/50 text-lg mb-10 max-w-xl mx-auto text-balance leading-relaxed">
            Workers build their record. Employers issue. Lenders query. Alora is the data layer — the loans are yours.
          </p>

          <div className="flex flex-wrap justify-center gap-3.5">
            <a href="#partners" className="a-btn a-btn-primary !px-9 !py-4">
              For Partners →
            </a>
            <button onClick={goDemo} className="a-btn a-btn-ghost !px-9 !py-4">
              See a Worker Record
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="relative z-10 border-t border-charcoal/12 bg-cream px-6 md:px-10 lg:px-14 py-9">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <AloraLogo size="sm" />
            <span className="text-charcoal/30 text-xs ml-1">The Bureau for Informal Labor</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 font-mono text-[12px] text-charcoal/35">
            <span>Built on Algorand</span>
            <span className="w-1 h-1 bg-charcoal/15 rounded-full" />
            <span>Worker-Owned</span>
            <span className="w-1 h-1 bg-charcoal/15 rounded-full" />
            <span>NBFC-Ready</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
