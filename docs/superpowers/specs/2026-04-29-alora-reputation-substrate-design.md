# Alora — Reputation Substrate for Workers

**Status:** Draft for review
**Date:** 2026-04-29
**Authors:** Divyanshu (with collaborative brainstorming)
**Predecessor:** GigPay (payment platform — superseded by this pivot)

---

## 1. Overview

Alora is a neutral, open reputation infrastructure for any worker, in any domain, in any geography. It records cryptographically-signed attestations about work, skills, and conduct. It exposes those attestations through a privacy-preserving, consent-gated read API that financial institutions, employers, insurers, and other consumers subscribe to.

Alora is built on Algorand and is intended to be published as an open ARC standard ("Generic Reputation Attestation Standard"). The protocol is open; the managed access, hosted tooling, and consumer-facing services are paid.

### What Alora is

- An issuance and read protocol for portable, verifiable work-history attestations.
- A worker-controlled, encrypted record of those attestations.
- A subscription-priced query API for financial and employment consumers.
- An open standard candidate that anyone can adopt or fork.

### What Alora is not

- Not a lender, NBFC, or insurer.
- Not a payment platform or escrow service.
- Not a gig marketplace or hiring platform.
- Not a custodian of identity documents (Aadhaar, passports, etc.).
- Not an opinionated scoring engine — Alora exposes raw attestations and structured issuer metadata; consumers compute their own scores.

### The pivot

Alora began as GigPay, a payment/escrow/delivery platform. Advisor feedback (Nikhil Varma) flagged that operating in the financial domain pulls a startup into compliance, licensing, and security exposure that's structurally unwise for an early-stage team. The recommended position is to **provide the means** — the substrate that financial actors plug into — not run financial operations.

Alora keeps the on-chain DNA of the original project (USDC-aware, Algorand-native, ARC-standards-aligned) but repositions away from running the money flow and toward owning the trust layer that the money flow depends on.

---

## 2. Architectural Decisions

These are the load-bearing choices made during brainstorming. Every other section in this document follows from them.

| # | Decision area | Choice | Reasoning |
|---|---|---|---|
| 1 | Smallest unit of trust | **Generic attestations** — any signed claim about a subject (work-event, skill, vouch, payment proof) | Maximum flexibility; works across all domains without forcing a single industry's data shape |
| 2 | Identity anchor | **Hybrid: phone-OTP at signup + delegated KYC** — Alora never stores government-ID PII; consumers requiring KYC integrate their own KYC partners | Avoids becoming a data custodian; keeps Alora out of compliance-heavy identity verification; works globally |
| 3 | Opinionated layer | **None — pure infrastructure.** Alora exposes raw attestations + structured issuer metadata. Consumers compute their own scores | Stays neutral; never opinionated about who's "creditworthy"; lets every consumer apply their own risk model |
| 4 | Revenue model | **Subscription tiers for consumers.** Workers free, issuers free, consumers pay | Predictable revenue; easier enterprise sales; per-query x402 micropayments deferred to V2 for long-tail consumers |
| 5 | Privacy & consent | **Private by default + per-consumer access grants.** Worker explicitly grants access; default is opaque | Regulatorily defensible (DPDP/GDPR); worker-empowering; minimum on-chain PII |
| 6 | Geography & vertical scope | **Fully horizontal from V1.** Generic across all domains and all geographies; vertical/regional tooling is a V2 layer | Matches the "global service provider" positioning; one codebase, plug-in localization |
| 7 | Attestation schema | **Minimal canonical schema.** Fixed set of core fields; typed payload schemas deferred to V2 schema registry | Smallest possible substrate that's still queryable; defers complexity until cross-domain volume demands it |
| 8 | Worker wallet UX (MVP) | **Self-custody via Pera/Defly + use-wallet.** Embedded/MPC wallets deferred to V2 | Ships fast on existing infrastructure already wired in the project; constrains MVP audience to crypto-comfortable users (freelance/creative segment) |

**Trade-offs explicitly accepted:**

- MVP audience is narrower than the full positioning suggests. Hotel housekeepers and airport contract workers won't onboard self-custody wallets — V2 must add embedded wallets before the long-tail informal market opens up.
- No opinionated score in V1 means consumers have to do more work; this is a feature, not a bug. The reference score becomes a V2 product surface.
- Generic schema means consumers parse domain-specific fields out of `claim` text. A schema registry is the V2 fix.

---

## 3. System Architecture

### 3.1 High-level components

```
┌──────────────────────────────────────────────────────────────────┐
│                         Alora Protocol                            │
│                                                                   │
│  ┌─────────────────┐   ┌─────────────────┐   ┌────────────────┐  │
│  │ WorkerRegistry  │   │  AttestationLog │   │  AccessGrants  │  │
│  │   (contract)    │   │    (contract)   │   │   (contract)   │  │
│  └─────────────────┘   └─────────────────┘   └────────────────┘  │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
        │                       │                       │
        │                       │                       │
┌───────▼───────┐       ┌───────▼───────┐       ┌──────▼──────┐
│  Issuer SDK   │       │ Encrypted     │       │  Read API   │
│  + No-code    │       │ Records       │       │  (gateway)  │
│  Portal       │       │ Vault         │       │             │
└───────────────┘       └───────────────┘       └─────────────┘
        │                       │                       │
        │                       │                       │
   ┌────▼──────────────┐  ┌─────▼──────┐         ┌──────▼─────┐
   │ Issuers           │  │ Workers    │         │ Consumers  │
   │ (employers,       │  │ (subjects) │         │ (NBFCs,    │
   │  freelance        │  │            │         │  insurers, │
   │  clients,         │  │            │         │  employers)│
   │  trainers)        │  │            │         │            │
   └───────────────────┘  └────────────┘         └────────────┘
```

### 3.2 On-chain components (Algorand smart contracts)

**Three contracts replace the legacy WorkerRegistry / DeliveryManager / EscrowPool stack.**

#### `WorkerRegistry` (refactored)
- Maps `phone_hash → wallet_address` (sybil anchor).
- Stores per-worker public profile pointer (handle, optional display name) — no PII.
- Operations: `register_worker`, `update_handle`, `lookup_by_phone_hash`.
- Storage: Box `wkr_{address}` → ~64 bytes (handle + phone_hash + registration_ts).

#### `AttestationLog` (new)
- Records canonical attestation entries on-chain.
- Each attestation has fixed core fields (see §4) + a content pointer (CID or hash to encrypted blob in the off-chain vault).
- Operations: `issue_attestation`, `revoke_attestation`, `lookup_by_subject`, `lookup_by_issuer`.
- Storage: Box `att_{id}` → ~120 bytes (no payload, just metadata + pointer + signature).

#### `AccessGrants` (new)
- Records per-consumer access grants from workers.
- Each grant: `(worker, consumer, scope, expires_at, signature)`.
- Operations: `grant_access`, `revoke_access`, `check_grant`.
- Storage: Box `gnt_{worker}_{consumer}` → ~80 bytes.

**Removed contracts:** `EscrowPool`, the old `DeliveryManager` (TaskVerification). These are no longer in the value flow — payment custody is not Alora's concern.

### 3.3 Off-chain components

#### Encrypted records vault
- Stores the **content** of every attestation, encrypted with a worker-controlled key.
- On-chain layer holds only the content pointer (CID) + content hash (for integrity).
- Implementation candidates: IPFS with worker-encrypted blobs, or a self-hosted store backed by S3-compatible storage with content-addressed hashes. **Decision deferred to plan.**
- Worker's encryption key is derived from their wallet (a deterministic key derivation from the wallet's signing key) so they can decrypt without holding a separate secret.

#### Read API gateway
- Subscription-gated REST/GraphQL endpoint.
- Authenticates consumers via API key tied to a subscription tier.
- Enforces access grants from `AccessGrants` contract before returning content.
- Returns: structured issuer metadata + decrypted attestation payload (decryption happens server-side on grant verification, using a re-encryption proxy or worker-delegated decryption — **mechanism deferred to plan**).
- Subscription billing system tied to consumer accounts.

#### Issuer no-code portal
- Web app where small employers (hotels, freelance clients, film producers) can:
  - Sign in with email + Algorand wallet (use-wallet).
  - Search for or invite a worker by phone number.
  - Issue an attestation by filling a form (category + claim text + optional rating).
  - View their own issuance history and reputation as an issuer.
- Necessary because the SDK alone won't reach non-technical issuers.

#### Issuer SDK
- TypeScript library: `@alora/issuer-sdk`.
- Wraps the on-chain `AttestationLog.issue_attestation` call + encrypted-vault upload.
- Used by gig platforms or creative agencies that want to programmatically issue attestations at scale.
- Out of scope for V1 MVP; tracked as V2.

### 3.4 KYC delegation (optional consumer-side)
- Alora does not perform KYC.
- Consumers requiring KYC integrate their own provider (e.g., Onfido, IDfy, Sumsub) directly with the worker.
- The KYC outcome can itself be issued as an attestation back into Alora by the consumer's KYC partner — this is how regulated lenders satisfy compliance without Alora ever touching identity documents.

---

## 4. Data Model

### 4.1 Canonical attestation schema (V1)

Every attestation has the following fields. There is no typed payload — domain-specific data goes in `claim` as opaque text/JSON. (Schema registry is V2.)

| Field | Type | Description |
|---|---|---|
| `id` | bytes32 | Unique attestation ID (hash of issuer + subject + issued_at + nonce) |
| `subject` | address | Worker's wallet address |
| `issuer` | address | Issuer's wallet address |
| `issued_at` | uint64 | Unix timestamp of issuance |
| `valid_until` | uint64 | Unix expiry; `0` means non-expiring |
| `category` | uint8 | Enum: `1=work_event`, `2=skill`, `3=payment_proof`, `4=vouch`, `5=other` |
| `weight` | uint16 | Issuer-suggested weight (0–10000, basis points). Hint only — consumers can ignore. |
| `content_cid` | bytes32 | Pointer to encrypted payload in off-chain vault |
| `content_hash` | bytes32 | SHA-256 of plaintext payload (integrity check) |
| `signature` | bytes64 | Issuer's Ed25519 signature over all fields above |

**On-chain footprint per attestation:** ~120 bytes in box storage. Content lives off-chain.

### 4.2 Issuer metadata (consumed alongside attestations)

When a consumer queries attestations, they get the records *plus* structured metadata about each issuer:

| Field | Description |
|---|---|
| `issuer_address` | Algorand address |
| `display_name` | Self-declared issuer name |
| `business_verification` | Enum: `verified_business`, `pseudonymous`, `flagged` |
| `attestations_issued_count` | Total lifetime issuances |
| `disputes_against` | Count of contested attestations |
| `first_seen` | Timestamp of first attestation issued |
| `verified_kyc_partner` | If a KYC partner attested to this issuer's identity |

This is the metadata consumers use to weight signal vs noise. Alora computes none of it into a score — that's the consumer's job.

### 4.3 Access grant schema

| Field | Type | Description |
|---|---|---|
| `worker` | address | Subject who granted access |
| `consumer` | address | Consumer (NBFC/insurer/employer) granted access |
| `scope` | bytes | Bitmask: which categories or specific attestation IDs |
| `granted_at` | uint64 | Timestamp of grant |
| `expires_at` | uint64 | Grant expiry (0 = no expiry) |
| `query_limit` | uint32 | Max queries within the grant window (0 = unlimited) |
| `signature` | bytes64 | Worker's signature over all fields |

---

## 5. Identity Model

### 5.1 Worker identity

- One worker = one phone number = one wallet address (in V1).
- At signup, worker:
  1. Connects their Algorand wallet (Pera/Defly).
  2. Verifies a phone number via OTP (Twilio or equivalent SMS provider).
  3. The mapping `keccak256(phone_number) → wallet_address` is recorded in `WorkerRegistry`.
- Phone numbers are never stored in plaintext on-chain or off-chain. Only `phone_hash`.
- Issuers issue attestations against either the wallet address or the phone hash (Alora resolves the latter to the former via the registry).
- **Sybil resistance:** Phone-OTP. A worker creating a second profile would need a second phone. Imperfect but pragmatic for V1.

### 5.2 Issuer identity

- Issuers connect via wallet (no phone-OTP requirement).
- Issuers can self-declare a display name and a business identifier (GST number / business registration / website domain).
- Self-declared info is unverified by default. A KYC partner or business-verification partner can attest to an issuer's claimed identity, which sets `business_verification = verified_business`.
- This means there are two tiers of issuers visible to consumers: pseudonymous and verified. Consumers can filter or weight as they choose.

### 5.3 Consumer identity

- Consumers (NBFCs, insurers) onboard through the Alora Read API console.
- Onboarding requires: business name, regulatory registration (e.g., RBI license number for India NBFCs), payment method for subscription, contact.
- Consumer identity is private to Alora; not on-chain.
- Each consumer is issued an API key tied to their subscription tier.

---

## 6. Privacy & Consent Model

### 6.1 Default state
All attestation content is **encrypted off-chain**. On-chain only records: attestation ID, subject, issuer, category, timestamp, content pointer, signature, and weight hint. No content payload is on-chain in any form.

### 6.2 Worker grants access
A consumer wanting to read a worker's attestations must hold a signed `AccessGrant` from that worker. The grant specifies:
- Which categories of attestations are accessible (e.g., only `work_event`, not `skill`).
- Optional time window.
- Optional query count limit.

A consumer without a grant cannot read content — the read API rejects the request even if they have a valid subscription.

### 6.3 Decryption flow (V1 mechanism — deferred to plan)
Two candidate mechanisms; the implementation plan picks one:

- **Option A — Server-side proxy decryption**: Alora holds an encrypted copy of each worker's content key, encrypted to a service key. When a grant is presented, the gateway decrypts the content and serves it to the authorized consumer. *Trade-off:* Alora becomes a key custodian for content keys. Operationally simple.
- **Option B — Worker-delegated re-encryption**: At grant time, worker re-encrypts (or signs a re-encryption capability for) the relevant content keys to the consumer's public key. Alora never holds plaintext keys. *Trade-off:* Worker must be online to grant, or use proxy re-encryption schemes (heavier crypto). Cleanest privacy story.

**Recommendation for plan:** Start with A for V1 (operational simplicity), document migration path to B (full self-custody privacy) as the "trust minimization" moat for V2.

### 6.4 Worker dashboard
Workers can:
- View all attestations issued to them.
- See who has been granted access, what they queried, and when.
- Revoke any grant at any time (revocation written on-chain, gateway respects within ~one block).
- Optionally hide specific attestations from default visibility.

### 6.5 Right to erasure
Workers can request deletion of attestations they were the subject of. Deletion model:
- On-chain attestation entry remains (immutability is part of the trust story) but is marked `revoked_by_subject`.
- Off-chain encrypted blob is deleted; future decryption is impossible.
- Consumers see "this attestation existed but was revoked" — preserving accountability while respecting erasure.

This is roughly DPDP-aligned and probably GDPR-defensible. Final regulatory review is a legal task for launch prep, not part of the engineering plan.

---

## 7. User Flows

### 7.1 Worker — first-time onboarding
1. Worker visits `/worker` and connects their Algorand wallet.
2. Worker enters phone number; receives OTP.
3. Worker submits OTP; `WorkerRegistry.register_worker(phone_hash, wallet_address, handle)` is signed and submitted.
4. Worker lands on dashboard. No attestations yet.

### 7.2 Issuer — issuing an attestation (no-code portal)
1. Issuer signs in via wallet at `/issuer`.
2. Issuer chooses "Issue attestation".
3. Issuer enters: subject (phone or wallet), category, claim text (e.g., "Worked night shift, hotel cleaning, 2025-04-28, 8 hours"), optional rating, optional expiry.
4. Issuer SDK / portal:
   - Encrypts the claim payload with the worker's public key (or the protocol's content key — see §6.3).
   - Uploads encrypted blob to vault, gets `content_cid`.
   - Computes `content_hash`.
   - Builds and signs the attestation transaction.
   - Submits `AttestationLog.issue_attestation(...)`.
5. Worker is notified (in-dashboard; email/SMS optional).

### 7.3 Consumer — querying attestations
1. Consumer onboards via Alora API console, picks a subscription tier, gets API key.
2. Consumer wants to query worker `0xABC...`. They must first hold a grant.
3. Consumer requests a grant from the worker (out-of-band: email link, embedded widget, deep link to Alora app). Worker reviews scope + duration and signs.
4. Consumer's backend queries `GET /v1/workers/{phone_or_address}/attestations?categories=work_event` with API key.
5. Gateway:
   - Verifies API key + active subscription.
   - Verifies on-chain `AccessGrant`.
   - Fetches attestation entries from `AttestationLog`.
   - Decrypts content via the configured mechanism (§6.3).
   - Joins with issuer metadata.
   - Returns structured response.
6. Consumer applies their own scoring model and uses the result however they choose (loan decision, employment check, insurance underwriting).

### 7.4 Worker — revoking access
1. Worker sees on dashboard: "NBFC X has access to your work_event attestations until 2026-08-01."
2. Worker clicks "Revoke."
3. Worker signs `AccessGrants.revoke_access(consumer)`.
4. Gateway honors revocation on next query.

---

## 8. Smart Contract Surface (Algorand Python / PuyaPy)

This section names the contracts and their public methods. Full ARC-32/56 specs and TypeScript clients are generated by AlgoKit during the build step.

### 8.1 `WorkerRegistry`
```python
@arc4.abimethod
def register_worker(phone_hash: Bytes32, handle: String) -> None: ...

@arc4.abimethod
def update_handle(handle: String) -> None: ...

@arc4.abimethod(readonly=True)
def lookup_by_phone_hash(phone_hash: Bytes32) -> Address: ...

@arc4.abimethod(readonly=True)
def get_worker_info(addr: Address) -> WorkerInfo: ...
```

### 8.2 `AttestationLog`
```python
@arc4.abimethod
def issue_attestation(
    subject: Address,
    category: UInt8,
    weight: UInt16,
    valid_until: UInt64,
    content_cid: Bytes32,
    content_hash: Bytes32,
    signature: Bytes64,
) -> Bytes32:  # returns attestation id
    ...

@arc4.abimethod
def revoke_attestation(att_id: Bytes32, reason_code: UInt8) -> None: ...

@arc4.abimethod(readonly=True)
def get_attestation(att_id: Bytes32) -> Attestation: ...

@arc4.abimethod(readonly=True)
def list_by_subject(subject: Address, offset: UInt32, limit: UInt16) -> Box[Bytes32]: ...
```

### 8.3 `AccessGrants`
```python
@arc4.abimethod
def grant_access(
    consumer: Address,
    scope_bitmask: UInt32,
    expires_at: UInt64,
    query_limit: UInt32,
    signature: Bytes64,
) -> None: ...

@arc4.abimethod
def revoke_access(consumer: Address) -> None: ...

@arc4.abimethod(readonly=True)
def check_grant(worker: Address, consumer: Address) -> Grant: ...
```

(Method signatures are illustrative. Final shapes finalized during plan + implementation.)

---

## 9. Off-Chain Services

### 9.1 Encrypted records vault
- Stores encrypted JSON payloads addressed by content CID.
- Returns blob given CID + appropriate auth.
- Implementation: IPFS for V1 (or self-hosted content-addressed storage if IPFS proves operationally heavy). **Final pick deferred to plan.**

### 9.2 Read API gateway
- Hono service (the existing `gigpay-oracle` project, repurposed and renamed).
- Endpoints (V1):
  - `POST /v1/consumers/onboard`
  - `GET /v1/workers/{address_or_phone_hash}/attestations`
  - `GET /v1/issuers/{address}/metadata`
  - `GET /v1/grants/active` (consumer's active grants)
- Subscription billing: Stripe (or equivalent). Subscription state cached and validated per request.

### 9.3 Issuer no-code portal (web app)
- Part of the existing `gigpay-frontend` project (renamed `alora-frontend` or kept as the same monorepo path).
- Routes: `/`, `/worker`, `/issuer`, `/consumer`, plus existing legacy routes that get retired.

### 9.4 Notification service
- Out-of-band notifications to workers when attestations are issued, when grants are requested.
- V1: in-dashboard only.
- V2: SMS / email via existing SMS provider used for OTP.

---

## 10. Revenue Model

### 10.1 Subscription tiers (V1)
- **Starter** — single user, low query volume. Targeted at small NBFCs, indie underwriters.
- **Growth** — team accounts, higher volume.
- **Enterprise** — custom volume, SLA, white-glove onboarding.

Pricing TBD during go-to-market planning. Numbers belong in pricing strategy, not in this doc.

### 10.2 What's free
- Workers: free, always.
- Issuers: free to issue, always.
- Open-source clients (issuer SDK, worker SDK once published): free.

### 10.3 V2 revenue extensions (not in V1 scope)
- Per-query x402 micropayments for long-tail consumers who don't want subscriptions.
- Paid managed/hosted instances of the protocol (the "Vercel for Alora" play).
- Premium analytics dashboards for enterprise consumers.
- Verified-issuer onboarding service (paid by issuer for the verification badge).

---

## 11. MVP Scope (V1)

### 11.1 In scope for V1
- Three smart contracts: `WorkerRegistry`, `AttestationLog`, `AccessGrants`.
- Frontend with three role-routes:
  - `/worker` — register, view my attestations, view/grant/revoke access.
  - `/issuer` — issue attestation, view my issuance history.
  - `/consumer` — onboard, view subscription status, query attestations (basic search UI).
- Read API gateway (subscription-gated, grant-checked).
- Encrypted records vault (V1 mechanism: server-side proxy decryption per §6.3 Option A).
- Phone-OTP signup for workers.
- Wallet connection (Pera/Defly) for all roles.
- New landing page reflecting the pivoted positioning.
- Open-sourceable repository hygiene (license, README, CONTRIBUTING).

### 11.2 Explicitly out of scope for V1
- Embedded/MPC wallet for workers (web2-style onboarding).
- Schema registry + typed attestation payloads.
- Issuer SDK (NPM package).
- ZK proofs of attestation thresholds.
- W3C Verifiable Credentials format compatibility.
- ARC standard publication.
- x402 micropayment access path.
- KYC partner integrations beyond "consumers can integrate their own".
- Worker → worker peer attestations.
- Cross-chain or multi-chain support.
- Mobile apps (worker / issuer / consumer all desktop-web in V1).
- Analytics / scoring dashboards.
- Internationalization (English only in V1).
- Anti-fraud automated signals (dispute system is manual / off-chain in V1).

### 11.3 Cold-start strategy for V1
A horizontal launch has no built-in wedge. The plan compensates with:
- A self-serve issuer no-code portal that anyone can use within 2 minutes.
- Seeded reference issuers across multiple domains (hand-recruit 5–10 launch issuers spanning film/freelance/hospitality/training-institute) to demonstrate cross-domain volume from day one.
- Public documentation explicitly inviting any platform to integrate.
- An open-sourceable contracts repo so the technical-credibility story is real.

This buys time while V2 work (embedded wallets, schema registry, paid SDK) opens up the long-tail informal market.

---

## 12. V2+ Roadmap (deferred from V1)

In rough priority order:

1. **Embedded wallet onboarding** for workers (Privy/Web3Auth integration). Unlocks the long-tail informal market (hotels, airports, construction, care).
2. **Schema registry contract.** Typed attestation payloads with versioning and consumer-side schema subscriptions.
3. **Issuer SDK** (`@alora/issuer-sdk`) for programmatic issuance at scale.
4. **Per-query x402 micropayments** for long-tail consumers.
5. **W3C VC compatibility** at the read-edge.
6. **ARC standard publication** for the canonical attestation format.
7. **ZK proofs** of attestation thresholds (privacy moat).
8. **Mobile apps** for worker and issuer.
9. **Internationalization** (Hindi, Tamil, Bahasa, Spanish, Portuguese, Arabic).
10. **Worker-delegated re-encryption** (Option B from §6.3) — eliminating Alora as a content-key custodian.
11. **Migrant corridor product** (V1 verticalization for India ↔ Gulf, Philippines ↔ HK/SG).
12. **Reference scoring engine** as an opt-in product on top of the raw protocol.

---

## 13. Open Questions

These are flagged for the implementation plan to resolve. None are blockers for design approval.

- **Encrypted vault implementation:** IPFS vs self-hosted content-addressed storage. Decide based on operational complexity and self-host requirement.
- **Decryption mechanism for V1:** Confirmed Option A (server-side proxy) — but the plan needs to spec the key-management infrastructure (HSM? KMS? rotation policy?).
- **Subscription billing provider:** Stripe vs Paddle vs LemonSqueezy. Pick during plan.
- **OTP provider:** Twilio vs MSG91 (India-first if go-to-market favors India). Pick during plan.
- **Indexer strategy:** Direct algod queries vs an Algorand indexer service vs a custom indexer for box-storage queries. Pick during plan; box-storage scan performance will dictate.
- **Open-source license:** Apache 2.0 vs MIT vs AGPL (if the protocol-as-public-good positioning matters strongly). Pick during plan.
- **Repo / project rename:** `gigpay` → `alora` rename across directories, package names, deployment configs. Plan must enumerate every rename touchpoint.
- **Legacy contract retirement:** EscrowPool, old DeliveryManager — leave them deployed (testnet-only currently, no real value at risk) but unlist from frontend, or formally destroy?
- **Legal review touchpoints (parallel track, not part of engineering plan):** DPDP/GDPR-compliance of consent and erasure flows, terms of service for issuers and consumers, open-source license selection.

---

## 14. Migration Notes from GigPay

The repo has substantial existing assets that shape the plan:

- `gigpay-contracts` — three legacy contracts. Two get retired (`escrow_pool`, `task_verification`). `worker_registry` gets refactored heavily. Two new contracts added (`AttestationLog`, `AccessGrants`).
- `gigpay-frontend` — full brutalist design system (Tailwind + custom tokens for terra/sage/sun/lavender/cream/charcoal palette, `nb-card`, `shadow-brutal-*`). **Reuse the design system; rewrite the page-level content.** New routes `/issuer` and `/consumer` to be added; existing `/worker` and `/platform` to be repurposed (`/platform` becomes legacy or is removed).
- `gigpay-oracle` — Hono service with x402 support. Repurpose as the Alora read API gateway. Drop the x402 path for V1; bring back for V2 micropayments.
- `gigpay-agent` — TypeScript agent service. Out of scope for V1; possibly retired or refocused as a notification worker in V2.

---

## 15. Success Criteria

Alora V1 is successful if, at the end of MVP delivery:

- A worker can register, see their attestations, and grant/revoke access — end-to-end on testnet.
- An issuer can issue a verified attestation through the no-code portal in under 60 seconds.
- A consumer can query a worker's attestations via the API and receive structured, decrypted content with issuer metadata.
- The contracts compile, deploy, and all integration tests pass on localnet and testnet.
- The landing page communicates the new positioning clearly enough that an outside reviewer (someone not in this conversation) understands "what Alora is and is not" within 30 seconds of loading.

---

*End of design document. Awaiting user review before transition to implementation plan.*
