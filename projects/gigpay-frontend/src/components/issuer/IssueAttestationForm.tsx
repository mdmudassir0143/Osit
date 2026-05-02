import React, { useEffect, useRef, useState } from 'react'
import algosdk from 'algosdk'
import { useWallet } from '@txnlab/use-wallet-react'
import { CATEGORY_LABELS, issueAttestation } from '../../services/attestations'
import { uploadPayload } from '../../services/vault'
import { isValidPhone, verifyAndHash } from '../../services/phone'
import { lookupByPhoneHash } from '../../services/registry'
import { IssuePrefill } from './WorkforceRoster'

interface Props {
  onIssued: () => void
  prefill?: IssuePrefill | null
}

const IssueAttestationForm: React.FC<Props> = ({ onIssued, prefill }) => {
  const { activeAddress, transactionSigner } = useWallet()
  const [subjectInput, setSubjectInput] = useState('')
  const [category, setCategory] = useState(1)
  const [claim, setClaim] = useState('')
  const [rating, setRating] = useState<string>('')
  const [validUntilDate, setValidUntilDate] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Apply prefill from sibling components (Workforce, Benefits, etc.).
  useEffect(() => {
    if (!prefill) return
    if (prefill.subject) setSubjectInput(prefill.subject)
    if (typeof prefill.category === 'number') setCategory(prefill.category)
    if (prefill.claim) setClaim(prefill.claim)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [prefill])

  const subjectIsAddress = subjectInput.length === 58 && algosdk.isValidAddress(subjectInput)
  const subjectIsPhone = !subjectIsAddress && isValidPhone(subjectInput)
  const subjectValid = subjectIsAddress || subjectIsPhone

  const canSubmit = subjectValid && claim.trim().length > 0 && !submitting && !!activeAddress

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !activeAddress || !transactionSigner) return
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      let subjectAddress = subjectInput
      if (subjectIsPhone) {
        const phoneHash = await verifyAndHash(subjectInput)
        const found = await lookupByPhoneHash(phoneHash, activeAddress)
        if (!found) {
          throw new Error('Phone not registered. The worker must register on Alora first.')
        }
        subjectAddress = found
      }

      const ratingNum = rating ? parseFloat(rating) : undefined
      const payload = {
        category,
        claim: claim.trim(),
        rating: ratingNum && !Number.isNaN(ratingNum) ? ratingNum : undefined,
      }
      const { contentCid, contentHash } = await uploadPayload(payload)

      const validUntil = validUntilDate ? BigInt(Math.floor(new Date(validUntilDate).getTime() / 1000)) : 0n

      const weight = ratingNum ? Math.min(10000, Math.round((ratingNum / 5) * 10000)) : 100

      await issueAttestation({
        sender: activeAddress,
        signer: transactionSigner,
        subject: subjectAddress,
        category,
        weight,
        validUntil,
        contentCid,
        contentHash,
      })
      setSuccess('Attestation issued.')
      setSubjectInput('')
      setClaim('')
      setRating('')
      setValidUntilDate('')
      onIssued()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Issuance failed'
      setError(msg.length > 200 ? `${msg.slice(0, 200)}…` : msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="nb-card bg-white rounded-2xl p-6 md:p-8 shadow-brutal-terra">
      <div className="mb-5">
        <span className="nb-tag bg-terra-light text-terra border-terra/40 text-[9px] mb-2">Issue</span>
        <h3 className="font-display text-xl font-bold text-charcoal mt-1">Attest to a worker's history</h3>
        <p className="text-charcoal/50 text-sm mt-1">Sign a claim on-chain. The worker owns the record from then on.</p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-charcoal/40 font-display font-semibold mb-2">
            Subject — wallet address or phone
          </label>
          <input
            type="text"
            value={subjectInput}
            onChange={(e) => setSubjectInput(e.target.value.trim())}
            placeholder="58-char address or phone like +91…"
            className="w-full px-3 py-2 border-[2px] border-charcoal/15 focus:border-charcoal rounded-lg bg-cream font-mono text-xs focus:outline-none"
          />
          {subjectInput && !subjectValid && <div className="text-[11px] text-terra mt-1">Doesn't look like a valid address or phone</div>}
        </div>

        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-charcoal/40 font-display font-semibold mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(Number(id))}
                className={`px-3 py-1.5 rounded-md text-[11px] font-mono font-semibold border-[1.5px] transition-colors ${
                  category === Number(id) ? 'bg-terra-light text-terra border-terra/40' : 'bg-cream text-charcoal/45 border-charcoal/15'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] tracking-[0.2em] uppercase text-charcoal/40 font-display font-semibold mb-2">Claim</label>
          <textarea
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            rows={3}
            placeholder='e.g. "Worked night shift 2026-04-29, 8 hours, hotel cleaning"'
            className="w-full px-3 py-2 border-[2px] border-charcoal/15 focus:border-charcoal rounded-lg bg-cream font-mono text-xs focus:outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-charcoal/40 font-display font-semibold mb-2">
              Rating (optional)
            </label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              placeholder="0–5"
              className="w-full px-3 py-2 border-[2px] border-charcoal/15 focus:border-charcoal rounded-lg bg-cream font-mono text-xs focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-charcoal/40 font-display font-semibold mb-2">
              Expires (optional)
            </label>
            <input
              type="date"
              value={validUntilDate}
              onChange={(e) => setValidUntilDate(e.target.value)}
              className="w-full px-3 py-2 border-[2px] border-charcoal/15 focus:border-charcoal rounded-lg bg-cream font-mono text-xs focus:outline-none"
            />
          </div>
        </div>

        {error && <div className="border-[2px] border-terra/30 bg-terra-light text-terra text-xs px-3 py-2 rounded-lg">{error}</div>}
        {success && <div className="border-[2px] border-sage/40 bg-sage-light text-sage text-xs px-3 py-2 rounded-lg">{success}</div>}

        <button
          type="submit"
          disabled={!canSubmit}
          className="nb-btn bg-terra text-cream w-full py-3 text-xs font-display font-bold tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Issuing…' : 'Issue Attestation'}
        </button>
      </form>
    </div>
  )
}

export default IssueAttestationForm
