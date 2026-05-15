import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AloraLogo from '../components/shared/AloraLogo'

const TICKER_ITEMS = [
  'PORTABLE WORK HISTORY',
  'CRYPTOGRAPHICALLY SIGNED',
  'WORKER-OWNED RECORDS',
  'CONSENT-GATED API',
  'OPEN STANDARD CANDIDATE',
  'ALGORAND-NATIVE',
  'ANY DOMAIN, ANY GEOGRAPHY',
  'NO FINANCIAL CUSTODY',
]

const STATS = [
  { value: '2B+', label: 'Informal workers globally', accent: 'bg-sun' },
  { value: '~80%', label: 'Have no verifiable work record', accent: 'bg-terra' },
  { value: '0%', label: 'Reputation portable across employers', accent: 'bg-lavender' },
  { value: 'Lost', label: 'When workers change jobs or borders', accent: 'bg-sage' },
]

const ATTESTATION_CATEGORIES = [
  {
    name: 'Work Event',
    code: 1,
    examples: 'Shifts, deliveries, projects',
    desc: 'A discrete unit of work performed and verified by an issuer.',
    accent: 'bg-sage',
  },
  {
    name: 'Skill',
    code: 2,
    examples: 'Certifications, demonstrated abilities',
    desc: 'A capability claim — verified by a trainer, employer, or peer.',
    accent: 'bg-sun',
  },
  {
    name: 'Payment Proof',
    code: 3,
    examples: 'Earned income, settled invoices',
    desc: 'On-chain or off-chain evidence of compensation received.',
    accent: 'bg-terra',
  },
  {
    name: 'Vouch',
    code: 4,
    examples: 'Peer endorsements, references',
    desc: 'A weighted endorsement from another verified actor.',
    accent: 'bg-lavender',
  },
  {
    name: 'Other',
    code: 5,
    examples: 'Domain-specific extensions',
    desc: "Free-form claims for use cases the canonical schema doesn't cover.",
    accent: 'bg-cream',
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
    color: 'bg-sage text-white',
    shadow: 'shadow-brutal-sage',
  },
  {
    step: '02',
    title: 'Any issuer attests to work',
    detail:
      'A hotel manager, freelance client, film producer, or training institute issues a signed attestation: who, what, when. Free, frictionless, on-chain.',
    tag: 'ISSUE',
    color: 'bg-sun text-charcoal',
    shadow: 'shadow-brutal-sun',
  },
  {
    step: '03',
    title: 'Records stay encrypted by default',
    detail:
      'On-chain holds only metadata + content pointer. The claim itself sits encrypted in the worker-owned vault. No PII visible to the public.',
    tag: 'PRIVACY',
    color: 'bg-lavender text-charcoal',
    shadow: 'shadow-brutal-lavender',
  },
  {
    step: '04',
    title: 'Worker grants access on demand',
    detail: 'A lender, insurer, or new employer requests access. Worker reviews scope and signs a per-consumer grant. Revocable any time.',
    tag: 'CONSENT',
    color: 'bg-terra text-white',
    shadow: 'shadow-brutal-terra',
  },
  {
    step: '05',
    title: 'Consumer queries the read API',
    detail:
      'Subscription-gated, grant-verified. Returns structured attestations + issuer metadata. Consumers compute their own scores. Alora is never opinionated.',
    tag: 'QUERY',
    color: 'bg-cream text-charcoal',
    shadow: 'shadow-brutal',
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
    shadow: 'shadow-brutal-sage',
    tagBg: 'bg-sage-light text-sage',
  },
  {
    name: 'AttestationLog',
    appId: import.meta.env.VITE_ATTESTATION_LOG_APP_ID,
    tag: 'ATTESTATIONS',
    desc: 'Canonical attestation entries. Fixed core fields + content pointer to the encrypted off-chain vault. Generic across domains and geographies.',
    methods: ['issue_attestation', 'revoke_attestation', 'get_attestation', 'list_by_subject'],
    storage: 'Box: att_{id} → ~120B',
    accent: 'bg-terra',
    shadow: 'shadow-brutal-terra',
    tagBg: 'bg-terra-light text-terra',
  },
  {
    name: 'AccessGrants',
    appId: import.meta.env.VITE_ACCESS_GRANTS_APP_ID,
    tag: 'CONSENT',
    desc: 'Per-consumer access grants from workers. Scope, expiry, query limits. Read API enforces grants on every query — no grant, no data.',
    methods: ['grant_access', 'revoke_access', 'check_grant'],
    storage: 'Box: gnt_{worker}_{consumer} → ~80B',
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
          <a href="#flow" className="text-sm font-medium text-charcoal/50 hover:text-charcoal transition-colors hidden md:block">
            Flow
          </a>
          <a href="#architecture" className="text-sm font-medium text-charcoal/50 hover:text-charcoal transition-colors hidden md:block">
            Architecture
          </a>
          <a href="#categories" className="text-sm font-medium text-charcoal/50 hover:text-charcoal transition-colors hidden md:block">
            Categories
          </a>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setAppMenuOpen((v) => !v)
              }}
              className="nb-btn bg-terra text-cream px-5 py-2.5 text-sm font-display font-bold flex items-center gap-2.5 shadow-brutal-sm"
            >
              Launch App
              <svg
                className={`w-3.5 h-3.5 transition-transform ${appMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {appMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border-[2.5px] border-charcoal rounded-xl shadow-brutal-lg overflow-hidden z-50">
                <button
                  onClick={() => navigate('/worker')}
                  className="w-full text-left px-5 py-4 hover:bg-sage/10 transition-colors border-b-2 border-charcoal/10 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-sage rounded-lg border-2 border-charcoal flex items-center justify-center flex-shrink-0">
                      <span className="text-cream text-xs font-bold">W</span>
                    </div>
                    <div>
                      <div className="font-display text-sm font-bold group-hover:text-sage transition-colors">Worker</div>
                      <div className="text-[11px] text-charcoal/40">View attestations, grant access</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/issuer')}
                  className="w-full text-left px-5 py-4 hover:bg-terra/10 transition-colors border-b-2 border-charcoal/10 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-terra rounded-lg border-2 border-charcoal flex items-center justify-center flex-shrink-0">
                      <span className="text-cream text-xs font-bold">I</span>
                    </div>
                    <div>
                      <div className="font-display text-sm font-bold group-hover:text-terra transition-colors">Issuer</div>
                      <div className="text-[11px] text-charcoal/40">Attest to work or skills</div>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/consumer')}
                  className="w-full text-left px-5 py-4 hover:bg-sun/10 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-sun rounded-lg border-2 border-charcoal flex items-center justify-center flex-shrink-0">
                      <span className="text-charcoal text-xs font-bold">C</span>
                    </div>
                    <div>
                      <div className="font-display text-sm font-bold group-hover:text-charcoal transition-colors">Consumer</div>
                      <div className="text-[11px] text-charcoal/40">Query attestations via API</div>
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
              Portable{' '}
              <span className="relative inline-block">
                work history
                <svg className="absolute -bottom-1 left-0 w-full" height="8" viewBox="0 0 200 8" preserveAspectRatio="none">
                  <path d="M0 5 Q50 0 100 5 T200 5" stroke="#c44b2b" strokeWidth="3" fill="none" />
                </svg>
              </span>
              <br />
              <span className="font-serif italic text-terra font-normal">for every worker.</span>
            </h1>

            <p className="text-charcoal/55 text-lg md:text-xl max-w-lg leading-relaxed mb-10">
              The open reputation layer for gig workers, freelancers, and informal labor. Cryptographically signed, worker-owned,
              consent-gated. Built on Algorand.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => {
                  const demo = import.meta.env.VITE_DEMO_WORKER_ADDRESS as string
                  if (demo) navigate(`/w/${demo}`)
                  else navigate('/worker')
                }}
                className="nb-btn bg-terra text-cream px-8 py-4 text-sm tracking-wide font-display font-bold uppercase"
              >
                Try the Demo &rarr;
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

              <span className="nb-tag bg-terra-light text-terra border-terra/40 text-[9px] mb-6">Why this matters</span>

              <div className="grid grid-cols-2 gap-5 mt-6">
                {STATS.map((stat, i) => (
                  <div key={i} className="relative">
                    <div className={`w-2.5 h-2.5 ${stat.accent} rounded-full border-[1.5px] border-charcoal mb-2`} />
                    <div className="font-display text-2xl md:text-3xl font-extrabold text-charcoal leading-none mb-1">{stat.value}</div>
                    <div className="text-xs text-charcoal/40 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-7 pt-5 border-t-2 border-dashed border-charcoal/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 bg-terra rounded-full animate-pulse" />
                  <span className="text-xs text-terra font-semibold">Alora gives them a record</span>
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
            <span className="nb-tag bg-sun-light text-charcoal border-charcoal/20 font-mono text-[9px] mb-4">How It Works</span>
            <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight mt-4 mb-3">
              From signup to <span className="font-serif italic text-terra font-normal">verifiable record</span>
            </h2>
            <p className="text-charcoal/45 text-base max-w-xl">
              A worker's reputation goes from invisible to portable in five steps. No payments, no escrow — just signed claims, owned by the
              worker, queryable by consent.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FLOW_STEPS.map((item) => (
              <div key={item.step} className={`nb-card bg-white rounded-xl p-6 ${item.shadow} relative`}>
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
                Three contracts, <span className="font-serif italic text-terra font-normal">one open protocol</span>
              </h2>
              <span className="nb-tag bg-sun-light text-charcoal border-charcoal/15 font-mono text-[9px]">
                Algorand TestNet · Open Standard Candidate
              </span>
            </div>

            {/* Contract cards */}
            <div className="grid md:grid-cols-3 gap-5 mb-12 stagger-children">
              {CONTRACTS.map((contract) => (
                <div key={contract.name} className={`nb-card bg-white rounded-2xl p-6 ${contract.shadow} group relative overflow-hidden`}>
                  {/* Top accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${contract.accent} rounded-t-2xl`} />

                  <div className="flex items-start justify-between mb-4 pt-2">
                    <div className={`w-9 h-9 ${contract.accent} rounded-lg border-2 border-charcoal flex items-center justify-center`}>
                      <span className="text-white text-xs font-bold font-mono">{contract.name.charAt(0)}</span>
                    </div>
                    <span className={`nb-tag ${contract.tagBg} border-charcoal/10 text-[9px]`}>{contract.tag}</span>
                  </div>

                  <h3 className="font-display text-lg font-bold mb-2 group-hover:text-terra transition-colors">{contract.name}</h3>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {contract.methods.map((m) => (
                      <span
                        key={m}
                        className="font-mono text-[10px] bg-cream text-charcoal/50 px-2 py-0.5 rounded-md border border-charcoal/10"
                      >
                        {m}()
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t-2 border-dashed border-charcoal/8 flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-charcoal/35">{contract.storage}</span>
                    {contract.appId && (
                      <a
                        href={`https://testnet.explorer.perawallet.app/application/${contract.appId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[10px] text-terra hover:text-terra-dark transition-colors whitespace-nowrap"
                      >
                        app {contract.appId} ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Query flow diagram */}
            <div className="nb-card bg-white rounded-2xl p-6 md:p-8 shadow-brutal">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-terra rounded-lg border-2 border-charcoal flex items-center justify-center">
                  <span className="text-cream text-xs font-bold">&#9889;</span>
                </div>
                <span className="font-display text-sm font-bold uppercase tracking-wide">Read API · Grant-Verified Query</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                  { num: '1', contract: 'Read API', method: 'verify_subscription()', color: 'bg-terra' },
                  { num: '2', contract: 'AccessGrants', method: 'check_grant()', color: 'bg-sun' },
                  { num: '3', contract: 'AttestationLog', method: 'list_by_subject()', color: 'bg-lavender' },
                  { num: '4', contract: 'Vault', method: 'decrypt_payload()', color: 'bg-sage' },
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
                  { color: 'bg-sage', text: 'No grant, no data' },
                  { color: 'bg-terra', text: 'Subscription-gated' },
                  { color: 'bg-sun', text: 'Worker can revoke any time' },
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

      {/* ═══════════ SECTION DIVIDER — CATEGORIES ═══════════ */}
      <div className="relative z-10 bg-cream">
        <div className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20">
          <div className="border-t-[2.5px] border-charcoal/10" />
        </div>
        <div className="flex items-center justify-center -mt-4">
          <div className="bg-cream px-6 flex items-center gap-3">
            <div className="w-3 h-3 bg-lavender rounded-full border-2 border-charcoal" />
            <span className="font-mono text-[10px] tracking-[0.25em] text-charcoal/30 uppercase font-medium">Attestation Categories</span>
            <div className="w-3 h-3 bg-lavender rounded-full border-2 border-charcoal" />
          </div>
        </div>
      </div>

      {/* ═══════════ CATEGORIES ═══════════ */}
      <section id="categories" className="relative z-10 bg-cream px-6 md:px-12 lg:px-20 pt-12 pb-24 md:pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
              Five categories, <span className="font-serif italic text-terra font-normal">one substrate</span>
            </h2>
            <p className="text-charcoal/45 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              The canonical schema is intentionally minimal. Domain-specific structure (industry, role, rating shape) lives in the encrypted
              payload — consumers parse what they need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ATTESTATION_CATEGORIES.map((cat, i) => (
              <div
                key={cat.code}
                className={`nb-card bg-white rounded-2xl p-6 ${i % 2 === 0 ? 'shadow-brutal-sage' : 'shadow-brutal-sun'} relative overflow-hidden`}
              >
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${cat.accent} rounded-t-2xl`} />
                <div className="flex items-start justify-between mb-4 pt-2">
                  <div className={`w-9 h-9 ${cat.accent} rounded-lg border-2 border-charcoal flex items-center justify-center`}>
                    <span className="text-charcoal text-xs font-bold font-mono">{cat.code}</span>
                  </div>
                  <span className="nb-tag bg-cream text-charcoal/50 border-charcoal/15 font-mono text-[9px]">category = {cat.code}</span>
                </div>
                <h3 className="font-display text-lg font-bold mb-2">{cat.name}</h3>
                <p className="text-charcoal/50 text-sm leading-relaxed mb-3">{cat.desc}</p>
                <div className="pt-3 border-t-2 border-dashed border-charcoal/8">
                  <span className="font-mono text-[10px] text-charcoal/40">{cat.examples}</span>
                </div>
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
                Why <span className="font-serif italic text-terra font-normal">Algorand?</span>
              </h2>
              <p className="text-charcoal/45 text-base leading-relaxed max-w-sm">
                Reputation infrastructure needs cheap writes (every shift, every project, every skill) and instant reads. Algorand settles
                in under 3 seconds at sub-cent fees, with box storage that scales to billions of attestations.
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
            {TECH_STACK.map((tech) => (
              <span
                key={tech}
                className="font-mono text-[11px] text-cream/60 border border-cream/10 px-3 py-2 hover:border-terra/40 hover:text-terra transition-colors"
              >
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
            Build on the open <span className="font-serif italic text-terra font-normal">reputation layer.</span>
          </h2>
          <p className="text-charcoal/45 text-lg mb-10 max-w-lg mx-auto text-balance">
            Issuers attest. Workers own. Consumers query. Alora is the protocol — your products are the application.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/issuer')}
              className="nb-btn bg-terra text-cream px-10 py-5 text-sm font-display font-bold tracking-widest uppercase"
            >
              Issuer Portal &rarr;
            </button>
            <button
              onClick={() => navigate('/consumer')}
              className="nb-btn bg-cream text-charcoal px-10 py-5 text-sm font-display font-bold tracking-widest uppercase"
            >
              Consumer API
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="relative z-10 border-t-[2.5px] border-charcoal bg-cream px-6 md:px-12 lg:px-20 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <AloraLogo size="sm" />
            <span className="text-charcoal/25 text-xs ml-1">Open Reputation Infrastructure</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 font-mono text-[10px] text-charcoal/30">
            <span>Built on Algorand</span>
            <span className="w-1.5 h-1.5 bg-charcoal/10 rounded-full" />
            <span>Worker-Owned</span>
            <span className="w-1.5 h-1.5 bg-charcoal/10 rounded-full" />
            <span>Open Standard Candidate</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
