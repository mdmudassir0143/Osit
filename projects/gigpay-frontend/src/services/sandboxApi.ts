// Sandbox API simulator — computes the response shape that the hosted
// /v1/score endpoint will return in Phase 5. Today this runs client-side
// against the same on-chain primitives a backed gateway would query.

import { AttestationRecord, listBySubject } from './attestations'
import { getWorkerProfile, WorkerProfile } from './registry'
import { computeAuraScore, ScoreBreakdown } from './score'

export interface VerifiedMonthlyIncome {
  mean: number
  median: number
  variance: number
  distinct_payers: number
  samples_observed: number
  unit: 'INR'
}

export interface TrustSignals {
  distinct_issuers: number
  vouches: number
  revocation_rate: number
  verified_business_ratio: number
}

export interface AttestationsSummary {
  total: number
  active: number
  by_category: Record<string, number>
  last_issued_at: number
}

export interface ConsentBlock {
  granted_at: number
  expires_at: number
  scope: string
  query_limit: number | null
  queries_used: number
}

export interface MetaBlock {
  network: string
  queried_at: number
  latency_ms: number
  app_ids: {
    worker_registry: string
    attestation_log: string
    access_grants: string
  }
}

export interface SandboxResponse {
  status: 'ok' | 'not_registered' | 'no_consent'
  address: string
  aura_score: number
  band: string
  verified_monthly_income: VerifiedMonthlyIncome
  stability_index: number
  trust_signals: TrustSignals
  tenure_months: number
  attestations_summary: AttestationsSummary
  consent: ConsentBlock
  meta: MetaBlock
}

// AA-compatible (Sahamati) response shape. Maps Alora data points to the
// closest FIP/FIU field equivalents so Indian NBFCs already integrated with
// the Account Aggregator framework can ingest Alora without new plumbing.
export interface AaResponse {
  ver: '1.1.2'
  txnId: string
  consent: { id: string; digitalSignature: string }
  FIPID: 'ALORA-IN-001'
  FI: Array<{
    fipID: 'ALORA-IN-001'
    Accounts: Array<{
      linkRefNumber: string
      maskedAccNumber: string
      data: {
        Profile: {
          Holders: { Holder: { name: string; ckycCompliance: boolean } }
        }
        Summary: {
          currentBalance: string
          currency: 'INR'
          balanceDateTime: string
        }
        Transactions: {
          Transaction: Array<{
            type: 'CREDIT'
            mode: 'ATTESTATION'
            amount: string
            narration: string
            valueDate: string
          }>
        }
        // Alora-specific extension fields (namespaced).
        AloraExt: {
          aura_score: number
          band: string
          stability_index: number
          trust_signals: TrustSignals
        }
      }
    }>
  }>
}

const BAND_BY_SCORE = (s: number): string => {
  if (s >= 851) return 'Excellent'
  if (s >= 701) return 'Very Good'
  if (s >= 551) return 'Good'
  if (s >= 301) return 'Fair'
  return 'Building'
}

// Derive a notional INR mean from the count of payment-proof attestations.
// Honest stub: in Phase 5 we extract amounts from decrypted claim payloads.
// Today we compute a credible aggregate from on-chain counts × an industry
// mean (gig-worker median income in tier-2 Indian cities, 2026).
const NOTIONAL_MONTHLY_MEAN = 14250
const NOTIONAL_VARIANCE = 0.08

function computeIncome(active: AttestationRecord[]): VerifiedMonthlyIncome {
  const payments = active.filter((a) => a.category === 3)
  const distinctPayers = new Set(payments.map((a) => a.issuer)).size
  // If no payment proofs yet, return zero income — never inflate.
  if (payments.length === 0) {
    return {
      mean: 0,
      median: 0,
      variance: 0,
      distinct_payers: 0,
      samples_observed: 0,
      unit: 'INR',
    }
  }
  // Use the average attestation weight as an income-quality coefficient.
  const avgWeight = payments.reduce((s, a) => s + a.weight, 0) / payments.length
  const coefficient = avgWeight / 10000
  const mean = Math.round(NOTIONAL_MONTHLY_MEAN * coefficient)
  return {
    mean,
    median: Math.round(mean * 0.985),
    variance: Number(NOTIONAL_VARIANCE.toFixed(2)),
    distinct_payers: distinctPayers,
    samples_observed: payments.length,
    unit: 'INR',
  }
}

function computeTrustSignals(
  attestations: AttestationRecord[],
  active: AttestationRecord[],
): TrustSignals {
  const issuers = new Set(active.map((a) => a.issuer))
  const vouches = active.filter((a) => a.category === 4).length
  const total = attestations.length
  const revokedCount = attestations.length - active.length
  const revocationRate = total > 0 ? Number((revokedCount / total).toFixed(3)) : 0
  // V1 placeholder: no on-chain verified-business registry yet, default to 0.
  // Phase 4+ will add an issuer-verification contract.
  return {
    distinct_issuers: issuers.size,
    vouches,
    revocation_rate: revocationRate,
    verified_business_ratio: 0,
  }
}

function computeAttestationsSummary(
  attestations: AttestationRecord[],
  active: AttestationRecord[],
): AttestationsSummary {
  const byCategory: Record<string, number> = {
    work_event: 0,
    skill: 0,
    payment_proof: 0,
    vouch: 0,
    other: 0,
  }
  const labels = ['', 'work_event', 'skill', 'payment_proof', 'vouch', 'other']
  for (const a of active) {
    const key = labels[a.category] || 'other'
    byCategory[key] += 1
  }
  const lastIssuedAt =
    active.length > 0
      ? Number(active.reduce((m, a) => (a.issuedAt > m ? a.issuedAt : m), 0n))
      : 0
  return {
    total: attestations.length,
    active: active.length,
    by_category: byCategory,
    last_issued_at: lastIssuedAt,
  }
}

function buildConsentStub(): ConsentBlock {
  const now = Math.floor(Date.now() / 1000)
  return {
    granted_at: now - 60 * 60 * 24,
    expires_at: now + 60 * 60 * 24 * 30,
    scope: 'all_categories',
    query_limit: null,
    queries_used: 1,
  }
}

function deriveStabilityIndex(score: ScoreBreakdown): number {
  // 0-100 composite. We rebuild this from existing breakdown components
  // rather than re-querying anything: recency + tenure + diversity.
  const recency = Math.max(0, score.components.recency + 50) // shift to 0-100
  const tenureNorm = Math.min(100, score.components.tenure * 1.25)
  const diversityNorm = score.components.diversity
  const composite = (recency + tenureNorm + diversityNorm) / 3
  return Math.round(composite)
}

export async function runSandboxQuery(
  address: string,
  viewer: string,
): Promise<SandboxResponse> {
  const start = performance.now()

  const profile: WorkerProfile = await getWorkerProfile(address)
  if (!profile.registered) {
    const latency = Math.round(performance.now() - start)
    return emptyResponse(address, 'not_registered', latency)
  }

  const attestations = await listBySubject(address, viewer)
  const nowSec = BigInt(Math.floor(Date.now() / 1000))
  const active = attestations.filter(
    (a) => !a.revoked && (a.validUntil === 0n || a.validUntil > nowSec),
  )

  const score = computeAuraScore(attestations, profile.registeredAt)
  const income = computeIncome(active)
  const trust = computeTrustSignals(attestations, active)
  const summary = computeAttestationsSummary(attestations, active)
  const consent = buildConsentStub()
  const tenureMonths = Math.round(score.yearsActive * 12)
  const stability = deriveStabilityIndex(score)
  const latency = Math.round(performance.now() - start)

  return {
    status: 'ok',
    address,
    aura_score: score.total,
    band: BAND_BY_SCORE(score.total),
    verified_monthly_income: income,
    stability_index: stability,
    trust_signals: trust,
    tenure_months: tenureMonths,
    attestations_summary: summary,
    consent,
    meta: {
      network: (import.meta.env.VITE_ALGOD_NETWORK as string) || 'testnet',
      queried_at: Math.floor(Date.now() / 1000),
      latency_ms: latency,
      app_ids: {
        worker_registry: String(import.meta.env.VITE_WORKER_REGISTRY_APP_ID || ''),
        attestation_log: String(import.meta.env.VITE_ATTESTATION_LOG_APP_ID || ''),
        access_grants: String(import.meta.env.VITE_ACCESS_GRANTS_APP_ID || ''),
      },
    },
  }
}

function emptyResponse(address: string, status: SandboxResponse['status'], latency: number): SandboxResponse {
  const now = Math.floor(Date.now() / 1000)
  return {
    status,
    address,
    aura_score: 0,
    band: 'Building',
    verified_monthly_income: { mean: 0, median: 0, variance: 0, distinct_payers: 0, samples_observed: 0, unit: 'INR' },
    stability_index: 0,
    trust_signals: { distinct_issuers: 0, vouches: 0, revocation_rate: 0, verified_business_ratio: 0 },
    tenure_months: 0,
    attestations_summary: { total: 0, active: 0, by_category: {}, last_issued_at: 0 },
    consent: { granted_at: 0, expires_at: 0, scope: 'none', query_limit: null, queries_used: 0 },
    meta: {
      network: (import.meta.env.VITE_ALGOD_NETWORK as string) || 'testnet',
      queried_at: now,
      latency_ms: latency,
      app_ids: {
        worker_registry: String(import.meta.env.VITE_WORKER_REGISTRY_APP_ID || ''),
        attestation_log: String(import.meta.env.VITE_ATTESTATION_LOG_APP_ID || ''),
        access_grants: String(import.meta.env.VITE_ACCESS_GRANTS_APP_ID || ''),
      },
    },
  }
}

// Map an Alora-native response to the Sahamati AA shape. Best-effort —
// real AA integration negotiates field-level mappings with each FIP.
export function toAaResponse(r: SandboxResponse): AaResponse {
  const balance = String(r.verified_monthly_income.mean * 12)
  const txns: AaResponse['FI'][0]['Accounts'][0]['data']['Transactions']['Transaction'] = []
  for (const [cat, count] of Object.entries(r.attestations_summary.by_category)) {
    if (count > 0) {
      txns.push({
        type: 'CREDIT',
        mode: 'ATTESTATION',
        amount: '0.00',
        narration: `Alora attestation × ${count} (${cat})`,
        valueDate: new Date(r.attestations_summary.last_issued_at * 1000).toISOString().slice(0, 10),
      })
    }
  }
  return {
    ver: '1.1.2',
    txnId: `alora-${r.meta.queried_at}-${r.address.slice(0, 6)}`,
    consent: {
      id: 'alora-consent-' + r.address.slice(0, 6),
      digitalSignature: '0x' + r.address.slice(2, 18),
    },
    FIPID: 'ALORA-IN-001',
    FI: [
      {
        fipID: 'ALORA-IN-001',
        Accounts: [
          {
            linkRefNumber: r.address.slice(0, 12),
            maskedAccNumber: 'XXXX' + r.address.slice(-4),
            data: {
              Profile: { Holders: { Holder: { name: '[masked]', ckycCompliance: false } } },
              Summary: {
                currentBalance: balance,
                currency: 'INR',
                balanceDateTime: new Date().toISOString(),
              },
              Transactions: { Transaction: txns },
              AloraExt: {
                aura_score: r.aura_score,
                band: r.band,
                stability_index: r.stability_index,
                trust_signals: r.trust_signals,
              },
            },
          },
        ],
      },
    ],
  }
}
