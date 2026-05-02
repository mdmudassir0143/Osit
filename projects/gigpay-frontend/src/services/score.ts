// Aura Score — opinionated *reference* score computed client-side.
//
// IMPORTANT: This score lives in the frontend only. The protocol itself
// records no opinionated score; consumers can compute their own. This
// formula is one canonical reference, useful for the dashboard and the
// pitch — not the source of truth.

import { AttestationRecord } from './attestations'

const BASE = 300
const SECONDS_PER_DAY = 86400
const SECONDS_PER_YEAR = 365.25 * SECONDS_PER_DAY

export type ScoreBand = 'Building' | 'Fair' | 'Good' | 'Very Good' | 'Excellent'

export interface ScoreComponents {
  base: number
  volume: number
  diversity: number
  issuerBreadth: number
  rating: number
  tenure: number
  recency: number
  bonus: number
  revocationPenalty: number
}

export interface ScoreBreakdown {
  total: number
  band: ScoreBand
  bandColor: 'terra' | 'sun' | 'sage' | 'lavender' | 'cream'
  components: ScoreComponents
  hints: string[]
  // Stats useful for the UI alongside the score.
  activeCount: number
  totalCount: number
  revokedCount: number
  distinctIssuers: number
  distinctCategories: number
  yearsActive: number
}

const bandFor = (score: number): { band: ScoreBand; color: ScoreBreakdown['bandColor'] } => {
  if (score >= 851) return { band: 'Excellent', color: 'cream' }
  if (score >= 701) return { band: 'Very Good', color: 'lavender' }
  if (score >= 551) return { band: 'Good', color: 'sage' }
  if (score >= 301) return { band: 'Fair', color: 'sun' }
  return { band: 'Building', color: 'terra' }
}

export function computeAuraScore(
  attestations: AttestationRecord[],
  registeredAt: bigint,
): ScoreBreakdown {
  const nowSec = Math.floor(Date.now() / 1000)

  const total = attestations.length
  const revoked = attestations.filter((a) => a.revoked).length
  const active = attestations.filter(
    (a) => !a.revoked && (a.validUntil === 0n || a.validUntil > BigInt(nowSec)),
  )

  // 1. Volume — log curve, capped at 200
  const volume = active.length > 0 ? Math.min(200, Math.log(active.length + 1) * 60) : 0

  // 2. Diversity — distinct categories among active attestations
  const categories = new Set(active.map((a) => a.category))
  const diversity = Math.max(0, (Math.min(5, categories.size) - 1) * 25)

  // 3. Issuer breadth — distinct issuers vouching
  const issuers = new Set(active.map((a) => a.issuer))
  const issuerBreadth = issuers.size > 0 ? Math.min(150, Math.log(issuers.size + 1) * 60) : 0

  // 4. Average rating (proxied via on-chain weight, basis points)
  const avgWeight = active.length > 0 ? active.reduce((sum, a) => sum + a.weight, 0) / active.length : 0
  const rating = (avgWeight / 10000) * 100

  // 5. Tenure — years since earliest attestation, fallback to registration date
  const earliestSec =
    active.length > 0
      ? Number(active.reduce((m, a) => (a.issuedAt < m ? a.issuedAt : m), active[0].issuedAt))
      : Number(registeredAt)
  const yearsActive = earliestSec > 0 ? (nowSec - earliestSec) / SECONDS_PER_YEAR : 0
  const tenure = Math.min(80, Math.max(0, yearsActive) * 20)

  // 6. Recency — days since most recent attestation
  let recency = 0
  if (active.length > 0) {
    const lastSec = Number(active.reduce((m, a) => (a.issuedAt > m ? a.issuedAt : m), 0n))
    const daysSinceLast = (nowSec - lastSec) / SECONDS_PER_DAY
    if (daysSinceLast < 30) recency = 50
    else if (daysSinceLast < 90) recency = 20
    else if (daysSinceLast < 180) recency = 0
    else if (daysSinceLast < 365) recency = -25
    else recency = -50
  }

  // 7. Vouches + payment proofs — both anchor real-world signal
  const vouches = active.filter((a) => a.category === 4).length
  const payments = active.filter((a) => a.category === 3).length
  const bonus = Math.min(60, vouches * 10 + payments * 5)

  // 8. Revocation penalty — too many revokes is a red flag
  const revocationPenalty = total > 0 ? -Math.min(100, (revoked / total) * 200) : 0

  const raw = BASE + volume + diversity + issuerBreadth + rating + tenure + recency + bonus + revocationPenalty
  const totalScore = Math.max(1, Math.min(1000, Math.round(raw)))

  const { band, color } = bandFor(totalScore)

  // Improvement hints — most-impactful first.
  const hints: string[] = []
  if (active.length < 3) {
    hints.push('Get 3+ employers or clients to attest. Volume is the fastest path to Fair.')
  }
  if (issuers.size < 2 && active.length > 0) {
    hints.push('Different issuers vouching is the strongest signal. Land at least 2 distinct issuers.')
  }
  if (categories.size < 3) {
    hints.push('Diversify across Work, Skill, Payment Proof, and Vouch categories.')
  }
  if (rating < 70 && active.length > 0) {
    hints.push('Aim for higher-rated attestations — quality lifts the score more than quantity.')
  }
  if (recency < 0) {
    hints.push('Your record is going stale. A fresh attestation in the next 30 days restores recency.')
  }
  if (revoked > 0) {
    hints.push('Revoked attestations are dragging your score. Resolve disputes with issuers when possible.')
  }
  if (hints.length === 0) {
    hints.push("You're trending well — keep stacking attestations across employers and categories.")
  }

  return {
    total: totalScore,
    band,
    bandColor: color,
    components: {
      base: BASE,
      volume: Math.round(volume),
      diversity: Math.round(diversity),
      issuerBreadth: Math.round(issuerBreadth),
      rating: Math.round(rating),
      tenure: Math.round(tenure),
      recency: Math.round(recency),
      bonus: Math.round(bonus),
      revocationPenalty: Math.round(revocationPenalty),
    },
    hints: hints.slice(0, 3),
    activeCount: active.length,
    totalCount: total,
    revokedCount: revoked,
    distinctIssuers: issuers.size,
    distinctCategories: categories.size,
    yearsActive,
  }
}
