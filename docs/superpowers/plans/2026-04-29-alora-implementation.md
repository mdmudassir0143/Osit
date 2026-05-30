# Alora V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pivot the existing GigPay payment platform into Alora — a neutral, open reputation infrastructure for portable worker attestations on Algorand.

**Architecture:** Three new/refactored Algorand smart contracts (`WorkerRegistry`, `AttestationLog`, `AccessGrants`) backed by an off-chain encrypted records vault, exposed through a subscription-gated read API gateway. Three frontend role-routes (worker / issuer / consumer) plus a rewritten landing page. Alora is pure infrastructure — no scoring, no payment custody, no KYC storage.

**Tech Stack:** Algorand Python (PuyaPy) for contracts, AlgoKit for build/deploy, React 18 + Vite + Tailwind + daisyUI + use-wallet for the frontend, Hono for the read API gateway, IPFS or self-hosted content-addressed storage for the vault, Twilio/MSG91 for SMS-OTP, Stripe for subscription billing.

**Spec reference:** `docs/superpowers/specs/2026-04-29-alora-reputation-substrate-design.md`

---

## Roadmap (8 Phases)

Phases 1 is fully detailed below. Phases 2–8 are outlined; each will get its own detailed sub-plan when its turn comes (the spec is too large for a single TDD-level plan).

| # | Phase | Goal | Blocks |
|---|---|---|---|
| 1 | **Landing Page Rewrite** | Replace payment-focused copy with reputation-substrate positioning. Reuse design system. No new components. | Nothing (pure copy/UI) |
| 2 | **Project Rename** | `gigpay` → `alora` across directory names, package names, env vars, deployment configs, READMEs. | Phases 3–8 (clean repo identity first) |
| 3 | **Smart Contracts** | Refactor `WorkerRegistry`, build `AttestationLog`, build `AccessGrants`. Retire `EscrowPool` and old `TaskVerification`. Deploy to localnet + testnet. | Phase 4, 5, 6 |
| 4 | **Frontend Role Routes** | Add `/issuer` and `/consumer`. Rewrite `/worker`. Retire `/platform`. Wire to typed clients from Phase 3. | Phase 8 |
| 5 | **Read API Gateway** | Repurpose `gigpay-oracle` as the subscription-gated query API. Subscription auth + grant verification + attestation read endpoints. | Phase 8 |
| 6 | **Encrypted Vault** | Storage backend choice + encryption/decryption flow + integration with issuer write path and gateway read path. | Phase 8 |
| 7 | **Phone-OTP Onboarding** | OTP provider integration + WorkerRegistry registration UX. | Phase 8 |
| 8 | **Integration & Deploy** | End-to-end testing across worker → issuer → consumer flows. TestNet deployment. README + landing-page CTA wired up. | — |

---

## Phase 1: Landing Page Rewrite (full detail — execute now)

The existing `Landing.tsx` is a long, design-system-heavy file built around the GigPay payment narrative. The brutalist visual system (terra/sage/sun/lavender/cream/charcoal palette, `nb-card`, `shadow-brutal-*`, ticker, grid-dots background) **stays as-is** — we only rewrite the copy and a few section structures to fit the new positioning.

**Key narrative shifts:**
- Hero: "Real-time payouts for gig platforms" → "Portable work history for every worker"
- Problem stats: "300M gig workers, 45% delayed payments" → "300M+ informal workers, ~80% no verifiable work history, lost reputation when changing employer"
- Flow: 6-step payment flow → 5-step attestation issuance + grant flow
- Architecture: 3 payment contracts → 3 reputation contracts
- "Performance determines pay" section → "Workers control disclosure" section (consent model)
- "Bad delivery? Money talks." anti-fraud → Removed (no longer relevant — we're not the financial layer)
- Compliance section (GST/PDF/audit) → Removed (we're not the financial layer; replace with "Open standard" section)
- CTA: "Stop running payroll manually" → "Build on the open reputation layer"
- Launch App menu: Merchant + Worker → Worker + Issuer + Consumer

**File scope:** Phase 1 modifies only `projects/gigpay-frontend/src/pages/Landing.tsx`. No new components, no router changes (those come in Phase 4), no new dependencies.

---

### Task 1.1: Rewrite the data constants at the top of Landing.tsx

**Files:**
- Modify: `projects/gigpay-frontend/src/pages/Landing.tsx:5-113`

**Why:** The constants (`TICKER_ITEMS`, `STATS`, `RATING_TABLE`, `FLOW_STEPS`, `CONTRACTS`) drive all the major sections. Updating them first means the rest of the file changes cascade naturally as we update the JSX in subsequent tasks.

- [ ] **Step 1: Replace `TICKER_ITEMS`**

Open `projects/gigpay-frontend/src/pages/Landing.tsx`. Replace the existing array (lines 5–14) with:

```typescript
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
```

- [ ] **Step 2: Replace `STATS`**

Replace the existing `STATS` array (lines 16–21) with:

```typescript
const STATS = [
  { value: '2B+', label: 'Informal workers globally', accent: 'bg-sun' },
  { value: '~80%', label: 'Have no verifiable work record', accent: 'bg-terra' },
  { value: '0%', label: 'Reputation portable across employers', accent: 'bg-lavender' },
  { value: 'Lost', label: 'When workers change jobs or borders', accent: 'bg-sage' },
]
```

- [ ] **Step 3: Replace `RATING_TABLE` with `ATTESTATION_CATEGORIES`**

Replace the existing `RATING_TABLE` array (lines 23–29) with a categories table that powers the section formerly known as Payouts:

```typescript
const ATTESTATION_CATEGORIES = [
  { name: 'Work Event', code: 1, examples: 'Shifts, deliveries, projects', desc: 'A discrete unit of work performed and verified by an issuer.', accent: 'bg-sage' },
  { name: 'Skill', code: 2, examples: 'Certifications, demonstrated abilities', desc: 'A capability claim — verified by a trainer, employer, or peer.', accent: 'bg-sun' },
  { name: 'Payment Proof', code: 3, examples: 'Earned income, settled invoices', desc: 'On-chain or off-chain evidence of compensation received.', accent: 'bg-terra' },
  { name: 'Vouch', code: 4, examples: 'Peer endorsements, references', desc: 'A weighted endorsement from another verified actor.', accent: 'bg-lavender' },
  { name: 'Other', code: 5, examples: 'Domain-specific extensions', desc: 'Free-form claims for use cases the canonical schema doesn\'t cover.', accent: 'bg-cream' },
]
```

- [ ] **Step 4: Replace `FLOW_STEPS`**

Replace the existing `FLOW_STEPS` array (lines 31–80) with the attestation lifecycle:

```typescript
const FLOW_STEPS = [
  {
    step: '01',
    title: 'Worker registers their wallet',
    detail: 'One-time signup: connect Pera/Defly + verify a phone number. Phone hash maps to wallet address — sybil anchor without storing PII.',
    tag: 'IDENTITY',
    color: 'bg-sage text-white',
    shadow: 'shadow-brutal-sage',
  },
  {
    step: '02',
    title: 'Any issuer attests to work',
    detail: 'A hotel manager, freelance client, film producer, or training institute issues a signed attestation: who, what, when. Free, frictionless, on-chain.',
    tag: 'ISSUE',
    color: 'bg-sun text-charcoal',
    shadow: 'shadow-brutal-sun',
  },
  {
    step: '03',
    title: 'Records stay encrypted by default',
    detail: 'On-chain holds only metadata + content pointer. The claim itself sits encrypted in the worker-owned vault. No PII visible to the public.',
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
    detail: 'Subscription-gated, grant-verified. Returns structured attestations + issuer metadata. Consumers compute their own scores. Alora is never opinionated.',
    tag: 'QUERY',
    color: 'bg-cream text-charcoal',
    shadow: 'shadow-brutal',
  },
]
```

- [ ] **Step 5: Replace `CONTRACTS`**

Replace the existing `CONTRACTS` array (lines 82–113) with the new three-contract architecture:

```typescript
const CONTRACTS = [
  {
    name: 'WorkerRegistry',
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
    tag: 'CONSENT',
    desc: 'Per-consumer access grants from workers. Scope, expiry, query limits. Read API enforces grants on every query — no grant, no data.',
    methods: ['grant_access', 'revoke_access', 'check_grant'],
    storage: 'Box: gnt_{worker}_{consumer} → ~80B',
    accent: 'bg-sun',
    shadow: 'shadow-brutal-sun',
    tagBg: 'bg-sun-light text-charcoal',
  },
]
```

- [ ] **Step 6: Verify the file still compiles**

Run from `projects/gigpay-frontend`:

```bash
npm run lint
```

Expected: passes (TypeScript and ESLint should still be happy — we only changed string content and array entries, no shape changes that affect renderers yet).

If you see "RATING_TABLE is not defined" or similar, that's expected for now — we'll fix the JSX consumers in subsequent tasks. Don't commit yet.

- [ ] **Step 7: Commit**

```bash
cd projects/gigpay-frontend
git add src/pages/Landing.tsx
git commit -m "refactor(landing): rewrite data constants for Alora positioning"
```

---

### Task 1.2: Update the navigation menu (Launch App dropdown)

**Files:**
- Modify: `projects/gigpay-frontend/src/pages/Landing.tsx:153-184` (the `appMenuOpen` dropdown)

**Why:** The current menu offers Merchant + Worker. Alora has three personas: Worker, Issuer, Consumer. Frontend role-routes don't exist yet (Phase 4), so the new menu items can navigate to `/worker`, `/issuer`, `/consumer` and we'll have the routes ready when Phase 4 lands. For now, the unbuilt routes will just render a 404 — that's fine; landing page is shipped first and the routes follow.

- [ ] **Step 1: Replace the dropdown contents**

Replace lines 153–184 (the `{appMenuOpen && (...)}` block) with:

```tsx
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
```

- [ ] **Step 2: Run lint**

```bash
cd projects/gigpay-frontend
npm run lint
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Landing.tsx
git commit -m "refactor(landing): replace nav dropdown with Worker/Issuer/Consumer roles"
```

---

### Task 1.3: Rewrite the hero section

**Files:**
- Modify: `projects/gigpay-frontend/src/pages/Landing.tsx:189-263` (the `{/* HERO */}` section)

- [ ] **Step 1: Replace headline, subline, and CTA buttons**

Replace lines 195–228 (the left-column `<h1>`, `<p>`, and CTA buttons) with:

```tsx
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
    The open reputation layer for gig workers, freelancers, and informal labor.
    Cryptographically signed, worker-owned, consent-gated. Built on Algorand.
  </p>

  <div className="flex flex-wrap gap-4">
    <button
      onClick={() => navigate('/issuer')}
      className="nb-btn bg-terra text-cream px-8 py-4 text-sm tracking-wide font-display font-bold uppercase"
    >
      Issue an Attestation &rarr;
    </button>
    <button
      onClick={() => navigate('/worker')}
      className="nb-btn bg-cream text-charcoal px-8 py-4 text-sm tracking-wide font-display font-bold uppercase"
    >
      Worker Dashboard
    </button>
  </div>
</div>
```

- [ ] **Step 2: Update the right-column "problem" card**

Replace lines 232–260 (the `<div className="nb-card ...">` for the stats card) with:

```tsx
<div className="nb-card p-8 md:p-10 bg-white rounded-2xl shadow-brutal-lg relative">
  {/* Corner accent */}
  <div className="absolute -top-3 -right-3 w-10 h-10 bg-sun rounded-lg border-[2.5px] border-charcoal flex items-center justify-center">
    <span className="text-charcoal text-lg">!</span>
  </div>

  <span className="nb-tag bg-terra-light text-terra border-terra/40 text-[9px] mb-6">
    Why this matters
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
      <span className="text-xs text-terra font-semibold">Alora gives them a record</span>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Run dev server and visually verify**

```bash
cd projects/gigpay-frontend
npm run dev
```

Open `http://localhost:5173/` (or whatever port Vite reports). Verify:
- Hero text reads "Portable work history for every worker."
- Subline mentions "open reputation layer".
- Stats card shows "2B+", "~80%", "0%", "Lost".
- Tagline reads "Alora gives them a record".

- [ ] **Step 4: Commit**

```bash
git add src/pages/Landing.tsx
git commit -m "refactor(landing): rewrite hero for reputation-substrate positioning"
```

---

### Task 1.4: Rewrite the flow section

**Files:**
- Modify: `projects/gigpay-frontend/src/pages/Landing.tsx:279-312` (the `{/* PAYMENT FLOW */}` section, including its anchor `id="flow"`)

- [ ] **Step 1: Update the section heading and intro copy**

Replace lines 282–292 (the section header div) with:

```tsx
<div className="mb-14">
  <span className="nb-tag bg-sun-light text-charcoal border-charcoal/20 font-mono text-[9px] mb-4">How It Works</span>
  <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight mt-4 mb-3">
    From signup to{' '}
    <span className="font-serif italic text-terra font-normal">verifiable record</span>
  </h2>
  <p className="text-charcoal/45 text-base max-w-xl">
    A worker's reputation goes from invisible to portable in five steps.
    No payments, no escrow — just signed claims, owned by the worker, queryable by consent.
  </p>
</div>
```

- [ ] **Step 2: The grid mapping over `FLOW_STEPS` does not need to change**

Lines 294–310 (the `<div className="grid ...">` mapping over `FLOW_STEPS`) work as-is because the array shape (step, title, detail, tag, color, shadow) is the same.

- [ ] **Step 3: Update the section anchor**

The `id="flow"` on line 280 is fine — it's already being referenced in nav links. Leave it.

- [ ] **Step 4: Verify in browser**

Refresh `http://localhost:5173/`. Scroll to the "How It Works" section. Verify:
- Heading: "From signup to verifiable record."
- Five flow cards: Identity, Issue, Privacy, Consent, Query.
- All tags and colors render correctly.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Landing.tsx
git commit -m "refactor(landing): rewrite flow section as attestation lifecycle"
```

---

### Task 1.5: Rewrite the architecture section

**Files:**
- Modify: `projects/gigpay-frontend/src/pages/Landing.tsx:329-428` (the `{/* ARCHITECTURE */}` section)

- [ ] **Step 1: Update the section heading**

Replace lines 333–338 (the `<div className="flex flex-col md:flex-row ...">` heading row) with:

```tsx
<div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
  <h2 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">
    Three contracts,{' '}
    <span className="font-serif italic text-terra font-normal">one open protocol</span>
  </h2>
  <span className="nb-tag bg-sun-light text-charcoal border-charcoal/15 font-mono text-[9px]">Algorand TestNet · Open Standard Candidate</span>
</div>
```

- [ ] **Step 2: Contract cards grid (no change needed to JSX)**

Lines 341–376 (the `{CONTRACTS.map(...)}` block) work as-is because the `CONTRACTS` array shape is the same. The new contract names + descriptions from Task 1.1 already populate this.

- [ ] **Step 3: Replace the "Atomic Confirm & Pay" diagram with a query-flow diagram**

Replace lines 378–425 (the `<div className="nb-card bg-white ...">` containing the atomic txn diagram) with a new "Query Flow" diagram:

```tsx
<div className="nb-card bg-white rounded-2xl p-6 md:p-8 shadow-brutal">
  <div className="flex items-center gap-3 mb-6">
    <div className="w-8 h-8 bg-terra rounded-lg border-2 border-charcoal flex items-center justify-center">
      <span className="text-cream text-xs font-bold">&#9889;</span>
    </div>
    <span className="font-display text-sm font-bold uppercase tracking-wide">
      Read API · Grant-Verified Query
    </span>
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
```

- [ ] **Step 4: Verify in browser**

Refresh. Scroll to Architecture. Verify:
- Three contract cards: WorkerRegistry (sage), AttestationLog (terra), AccessGrants (sun).
- Query flow diagram with 4 steps: Read API → AccessGrants → AttestationLog → Vault.
- Footnote tags: "No grant, no data", "Subscription-gated", "Worker can revoke any time".

- [ ] **Step 5: Commit**

```bash
git add src/pages/Landing.tsx
git commit -m "refactor(landing): rewrite architecture for new contract surface and query flow"
```

---

### Task 1.6: Replace the "Payouts" section with an "Attestation Categories" section

**Files:**
- Modify: `projects/gigpay-frontend/src/pages/Landing.tsx:430-574` (the section divider for Payouts, the section header, the formula card, and the rating table)

The section formerly known as Payouts (everything between `{/* SECTION DIVIDER — PAYOUTS */}` and the end of the rating-table section) is replaced with a single, simpler section showing the five attestation categories.

- [ ] **Step 1: Replace the entire payout block with a categories block**

Delete lines 430–574 (the divider, header, formula+features, and rating table). Insert the following in their place:

```tsx
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
        Five categories,{' '}
        <span className="font-serif italic text-terra font-normal">one substrate</span>
      </h2>
      <p className="text-charcoal/45 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
        The canonical schema is intentionally minimal. Domain-specific structure
        (industry, role, rating shape) lives in the encrypted payload — consumers
        parse what they need.
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
            <span className="nb-tag bg-cream text-charcoal/50 border-charcoal/15 font-mono text-[9px]">
              category = {cat.code}
            </span>
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
```

- [ ] **Step 2: Verify in browser**

Refresh. Scroll past Architecture. Verify:
- Section divider: "Attestation Categories".
- Heading: "Five categories, one substrate."
- Five cards: Work Event, Skill, Payment Proof, Vouch, Other.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Landing.tsx
git commit -m "refactor(landing): replace payouts section with attestation categories"
```

---

### Task 1.7: Remove the anti-fraud and compliance sections

**Files:**
- Modify: `projects/gigpay-frontend/src/pages/Landing.tsx:576-797` (the `{/* SECTION DIVIDER — ANTI-FRAUD */}` block + ANTI-FRAUD section + COMPLIANCE section)

Both sections were specific to the payment-platform framing (rating-driven payouts, GST invoices). Neither belongs in the new positioning. Remove them entirely; the page flows directly from Categories to "Why Algorand" to Tech Stack.

- [ ] **Step 1: Delete the anti-fraud divider and section**

Remove lines 576–684 — that's the entire `{/* SECTION DIVIDER — ANTI-FRAUD */}` div plus the `{/* ANTI-FRAUD */}` section.

- [ ] **Step 2: Delete the compliance section**

Remove lines 751–797 — the `{/* COMPLIANCE SECTION */}` block. Note: line numbers shift after the previous deletion; identify by section comment and surrounding markup, not by absolute line number.

- [ ] **Step 3: Verify the "Why Algorand" section still renders**

Refresh. Verify Categories → Why Algorand → Tech Stack → CTA → Footer flow with no orphan sections.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Landing.tsx
git commit -m "refactor(landing): remove anti-fraud and GST compliance sections"
```

---

### Task 1.8: Update the "Why Algorand" copy and Tech Stack list

**Files:**
- Modify: `projects/gigpay-frontend/src/pages/Landing.tsx` — the `{/* WHY ALGORAND */}` section and the `{/* DARK: TECH STACK */}` section

- [ ] **Step 1: Update the Why-Algorand intro paragraph**

Find the `<p className="text-charcoal/45 text-base leading-relaxed max-w-sm">` inside the Why-Algorand section. Replace its content with:

```
Reputation infrastructure needs cheap writes (every shift, every project, every skill) and instant reads. Algorand settles in under 3 seconds at sub-cent fees, with box storage that scales to billions of attestations.
```

The six-stat grid below it (Finality, Tx Fee, TPS, Carbon, Uptime, Storage) stays as-is — those numbers are still accurate.

- [ ] **Step 2: Update the Tech Stack chip list**

Find the array of tech-stack chips and replace with:

```typescript
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
```

Then update the JSX block that renders them (currently inline-array):

```tsx
{TECH_STACK.map((tech) => (
  <span key={tech} className="font-mono text-[11px] text-cream/60 border border-cream/10 px-3 py-2 hover:border-terra/40 hover:text-terra transition-colors">
    {tech}
  </span>
))}
```

(Hoist `TECH_STACK` to the top of the file alongside the other constants.)

- [ ] **Step 3: Verify in browser**

Refresh. Verify:
- Why-Algorand intro mentions "every shift, every project, every skill".
- Six-stat grid renders.
- Tech-stack chips include "IPFS / Encrypted Vault" and "Hono Read API"; do NOT include "USDC", "Atomic Groups", "Inner Transactions" (those were payment-specific).

- [ ] **Step 4: Commit**

```bash
git add src/pages/Landing.tsx
git commit -m "refactor(landing): update Why-Algorand copy and tech stack"
```

---

### Task 1.9: Rewrite the CTA section and the footer

**Files:**
- Modify: `projects/gigpay-frontend/src/pages/Landing.tsx` — the `{/* CTA */}` section and the `{/* FOOTER */}` section

- [ ] **Step 1: Replace the CTA headline, subline, and buttons**

Find the `{/* CTA */}` section. Replace its inner block with:

```tsx
<section className="relative z-10 bg-cream px-6 md:px-12 lg:px-20 py-24 md:py-32">
  <div className="max-w-3xl mx-auto text-center">
    <div className="w-12 h-1 bg-terra rounded-full mx-auto mb-8" />
    <h2 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05] mb-6">
      Build on the open{' '}
      <span className="font-serif italic text-terra font-normal">reputation layer.</span>
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
```

- [ ] **Step 2: Update the footer tagline and chips**

Find the `<footer ...>` block. Replace its contents with:

```tsx
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
```

- [ ] **Step 3: Update nav anchor links**

The top navigation has hardcoded anchor links to `#flow`, `#architecture`, `#payouts`. The `#payouts` anchor no longer exists (it's `#categories` now). Find the nav `<a href="#payouts">Payouts</a>` link and update:

```tsx
<a href="#categories" className="text-sm font-medium text-charcoal/50 hover:text-charcoal transition-colors hidden md:block">Categories</a>
```

- [ ] **Step 4: Verify in browser**

Refresh. Verify:
- CTA reads "Build on the open reputation layer."
- CTA buttons: "Issuer Portal" and "Consumer API".
- Footer tagline: "Open Reputation Infrastructure".
- Footer chips: "Built on Algorand · Worker-Owned · Open Standard Candidate".
- Top nav links: Flow / Architecture / Categories — and clicking Categories scrolls correctly.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Landing.tsx
git commit -m "refactor(landing): rewrite CTA and footer for open-protocol positioning"
```

---

### Task 1.10: Final visual review and edge-case check

**Files:**
- Browser visual review only.

- [ ] **Step 1: Top-to-bottom scroll review at 1920×1080**

Resize browser to a wide viewport. Scroll from top to bottom. Verify:
- No "RATING_TABLE" or other undefined-variable runtime errors in DevTools console.
- All section transitions look intentional (no orphaned dividers, no oversized blank space).
- The narrative flows: Hero (problem) → Ticker → How It Works → Architecture → Categories → Why Algorand → Tech Stack → CTA → Footer.

- [ ] **Step 2: Mobile viewport review (375×812)**

Open Chrome DevTools, switch to iPhone-SE viewport (375×812). Scroll the page. Verify:
- Hero stacks correctly (headline above stats card).
- Flow cards stack to a single column.
- Contract cards stack to a single column.
- Categories cards stack to a single column.
- Nav menu opens correctly when "Launch App" is tapped.

- [ ] **Step 3: Click each CTA**

Click each of: "Issue an Attestation", "Worker Dashboard" (hero), the Launch App dropdown's three role buttons, "Issuer Portal", "Consumer API". Each should navigate (even if to a 404 — those routes are Phase 4). The presence of navigation indicates the buttons are wired correctly.

- [ ] **Step 4: Run typecheck and lint**

```bash
cd projects/gigpay-frontend
npm run lint
```

Expected: no errors. If unused imports remain (like the old `RATING_TABLE`), remove them.

- [ ] **Step 5: Commit any final cleanup**

If the lint pass surfaces unused imports, dead variables, or unreachable code:

```bash
git add src/pages/Landing.tsx
git commit -m "chore(landing): remove unused symbols after Alora rewrite"
```

If nothing is left to clean, skip this step.

- [ ] **Step 6: Push (optional — coordinate with user before pushing to main)**

Do NOT push without user confirmation. The user explicitly requested landing-page-first; pushing main is a separate decision they should make explicitly.

---

## Phase 1 Definition of Done

- All 10 tasks have green checkboxes.
- `npm run lint` passes from `projects/gigpay-frontend`.
- The dev server renders the new landing without console errors.
- A first-time visitor can read the page top to bottom and understand: (a) Alora is portable work-history infrastructure, (b) it's not a payment platform, (c) there are three roles — Worker, Issuer, Consumer.
- All commits made through Phase 1 are atomic and have clear messages.

---

## Phases 2–8 Outline (sub-plans to be expanded when reached)

Each of these phases will get its own detailed sub-plan (`docs/superpowers/plans/2026-XX-XX-alora-phase-N-<topic>.md`) when we're ready to execute it. This outline is the contract between the spec and those future plans — it defines scope and dependencies, not step-by-step tasks.

### Phase 2: Project Rename (`gigpay` → `alora`)

**Goal:** Update directory names, package names, env vars, deployment configs, READMEs, and CI/CD references so the codebase identity matches the product identity.

**Touchpoints:**
- `projects/gigpay-contracts/` → `projects/alora-contracts/`
- `projects/gigpay-frontend/` → `projects/alora-frontend/`
- `projects/gigpay-oracle/` → `projects/alora-gateway/` (renamed for clarity — it's no longer an oracle, it's the read API)
- `projects/gigpay-agent/` → retire (not in V1 scope per spec §14)
- `gigpay.code-workspace` → `alora.code-workspace`
- `package.json` `name` fields, README titles
- `.github/workflows/*.yml` paths
- TestNet deployment scripts

**Risks:** Path-change touches every CI workflow and possibly Vercel deploy hooks. Plan must enumerate all CI/CD touchpoints exhaustively.

---

### Phase 3: Smart Contracts

**Goal:** Refactor `WorkerRegistry`, build `AttestationLog`, build `AccessGrants`. Retire legacy contracts. Deploy to localnet + testnet.

**Touchpoints:**
- `projects/alora-contracts/smart_contracts/worker_registry/contract.py` — refactor: drop rating, earnings, deliveries; add phone_hash mapping and handle.
- `projects/alora-contracts/smart_contracts/attestation_log/contract.py` — new contract per spec §8.2.
- `projects/alora-contracts/smart_contracts/access_grants/contract.py` — new contract per spec §8.3.
- `projects/alora-contracts/smart_contracts/escrow_pool/` — DELETE.
- `projects/alora-contracts/smart_contracts/task_verification/` — DELETE.
- Tests under `projects/alora-contracts/tests/` for each new contract (algorandFixture per superpowers:test-smart-contracts skill).
- Update `__main__.py` to deploy the new contract set.
- Regenerate ARC-56 artifacts and TypeScript clients (linked into frontend by `algokit project link --all`).

**Sub-plan should follow:** `algorand-plugin:algorand-python` skill for contract code; `superpowers:test-driven-development` skill for tests.

**Dependencies:** Blocks Phase 4 (frontend needs typed clients), Phase 5 (gateway calls contracts), Phase 6 (vault writes reference contract IDs).

---

### Phase 4: Frontend Role Routes

**Goal:** Build out `/worker`, `/issuer`, `/consumer` routes with their dashboards. Retire `/platform`.

**Touchpoints:**
- `projects/alora-frontend/src/App.tsx` — add `/issuer` and `/consumer` routes; remove `/platform`.
- `projects/alora-frontend/src/pages/WorkerDashboard.tsx` — rewrite around attestations + grants, not deliveries + earnings.
- `projects/alora-frontend/src/pages/IssuerDashboard.tsx` — new. List of issued attestations + form to issue a new one.
- `projects/alora-frontend/src/pages/ConsumerDashboard.tsx` — new. Subscription status + query interface + grant requests.
- `projects/alora-frontend/src/components/worker/` — heavy refactor; many existing components retire (DeliveryHistory, EarningsBreakdown, OfframpCard, SendUsdc, RatingInsight) or get repurposed (WorkerProfile).
- `projects/alora-frontend/src/components/issuer/` — new directory with IssueAttestationForm, IssuanceHistory, IssuerProfile.
- `projects/alora-frontend/src/components/consumer/` — new directory with QueryConsole, GrantStatus, SubscriptionPanel.
- `projects/alora-frontend/src/components/platform/` — retire entirely.

**Sub-plan should follow:** `algorand-plugin:deploy-react-frontend` skill for wallet integration; the existing brutalist design system (Tailwind tokens, `nb-card`, `shadow-brutal-*`) for visual continuity.

**Dependencies:** Blocked by Phase 3 (typed clients). Used by Phase 8 (integration tests).

---

### Phase 5: Read API Gateway

**Goal:** Repurpose `gigpay-oracle` as `alora-gateway`. Implement subscription auth, grant verification, and attestation-read endpoints per spec §9.2.

**Touchpoints:**
- `projects/alora-gateway/src/index.ts` — main Hono app.
- `projects/alora-gateway/src/auth/` — subscription API key middleware (Stripe-backed in V1 per spec §10).
- `projects/alora-gateway/src/grants/` — on-chain `AccessGrants` lookup + caching layer.
- `projects/alora-gateway/src/attestations/` — `AttestationLog` reads + vault decryption.
- `projects/alora-gateway/src/routes/` — endpoints: `/v1/consumers/onboard`, `/v1/workers/:id/attestations`, `/v1/issuers/:address/metadata`, `/v1/grants/active`.
- Drop the existing x402 path for V1 (deferred to V2 per spec §10.3).

**Dependencies:** Blocked by Phase 3 (contracts) and Phase 6 (vault). Used by Phase 8.

---

### Phase 6: Encrypted Vault

**Goal:** Storage backend + encryption/decryption flow + write/read integration.

**Touchpoints:**
- Decide IPFS vs self-hosted content-addressed storage (spec §13 open question).
- Decide V1 decryption mechanism — spec recommends Option A (server-side proxy) with Option B (worker-delegated re-encryption) on roadmap.
- Implement `projects/alora-gateway/src/vault/client.ts` for read path.
- Implement `projects/alora-frontend/src/services/vault.ts` for write path (issuer encrypts payload before submitting attestation transaction).

**Sub-plan should resolve:** spec §13 open questions on vault implementation and key management.

**Dependencies:** Blocked by Phase 3 (attestations reference vault CIDs). Used by Phase 5 and Phase 8.

---

### Phase 7: Phone-OTP Onboarding

**Goal:** Worker registration flow with phone verification, sybil-anchored to wallet address.

**Touchpoints:**
- Pick OTP provider — Twilio (global) vs MSG91 (India-cheaper). Spec §13 open question.
- New service component: `projects/alora-gateway/src/otp/` for OTP issuance and verification.
- New frontend flow: `projects/alora-frontend/src/components/worker/RegisterWorker.tsx` — replace existing component with phone-OTP onboarding that calls the gateway then submits `WorkerRegistry.register_worker` with phone_hash.

**Dependencies:** Blocked by Phase 3 (`WorkerRegistry`) and Phase 5 (gateway hosts the OTP endpoint). Used by Phase 8.

---

### Phase 8: Integration & Deploy

**Goal:** End-to-end verification of the worker → issuer → consumer journey. TestNet deployment. README and landing-page CTA wiring confirmed.

**Touchpoints:**
- Playwright E2E test: register a worker → issue an attestation → grant a consumer → consumer queries → consumer sees decrypted attestation.
- Deploy contracts to TestNet via existing `algokit project deploy testnet` flow.
- Deploy frontend to Vercel (existing CI workflow).
- Deploy gateway (decision: same Vercel deploy? separate Cloud Run / Fly.io? — deferred to plan).
- Update root `README.md` to reflect Alora positioning, link to spec.
- Final smoke test from a fresh user perspective on TestNet.

**Definition of Done for V1 launch:** Spec §15 success criteria are all met.

---

## Self-Review Notes (post-write)

This plan was self-reviewed against the spec. Findings:

- **Spec §3.2 — three contracts:** Covered by Phase 3 outline.
- **Spec §3.3 — off-chain components:** Vault → Phase 6, Gateway → Phase 5, Issuer portal → Phase 4 (component IssueAttestationForm), Issuer SDK → out of scope per spec §11.2 (V2).
- **Spec §4 — data model:** Surfaced in Phase 3 contracts; field shapes copied verbatim from spec into `AttestationLog` task.
- **Spec §5 — identity model:** Worker phone-OTP → Phase 7. Issuer wallet-only → handled in Phase 4 issuer dashboard. Consumer onboarding via gateway → Phase 5.
- **Spec §6 — privacy & consent:** Vault encryption → Phase 6. Grants contract → Phase 3. Worker dashboard for grant management → Phase 4.
- **Spec §7 — user flows:** All four flows are covered across Phases 3–7; Phase 8 integration tests verify them end-to-end.
- **Spec §11.1 — V1 in-scope:** Every bullet maps to a phase. Landing page (Phase 1, fully detailed). Three contracts (Phase 3). Three role-routes (Phase 4). Read API gateway (Phase 5). Vault (Phase 6). Phone-OTP (Phase 7). Wallet connection (already exists; touched in Phase 4). OSS hygiene (covered in Phase 8 README task).
- **Spec §11.2 — V1 out-of-scope:** Verified absent from all phase scopes.
- **Spec §13 — open questions:** Each open question is assigned to a phase that will resolve it (vault → Phase 6; OTP provider → Phase 7; subscription billing provider → Phase 5; indexer strategy → Phase 5; OSS license → Phase 8 README; rename touchpoints → Phase 2; legacy contract retirement → Phase 3).
- **Phase 1 placeholders:** None. Every code block is complete; every command is exact; every step has expected output.
- **Phase 1 type/symbol consistency:** `ATTESTATION_CATEGORIES` introduced in Task 1.1, consumed in Task 1.6 — names match. `TECH_STACK` introduced in Task 1.8 — used inside the same task. No symbols referenced before defined.

No gaps requiring inline fixes.
