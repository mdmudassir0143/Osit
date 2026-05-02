import React, { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { isValidPhone, verifyAndHash } from '../../services/phone'
import { registerWorker } from '../../services/registry'

interface Props {
  onRegistered: () => void
}

const RegisterWorker: React.FC<Props> = ({ onRegistered }) => {
  const { activeAddress, transactionSigner } = useWallet()
  const [handle, setHandle] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleValid = handle.length >= 4 && handle.length <= 30
  const phoneValid = isValidPhone(phone)
  const canSubmit = handleValid && phoneValid && !submitting && !!activeAddress

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !activeAddress || !transactionSigner) return
    setSubmitting(true)
    setError(null)
    try {
      const phoneHash = await verifyAndHash(phone)
      await registerWorker({
        sender: activeAddress,
        signer: transactionSigner,
        phoneHash,
        handle,
      })
      onRegistered()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      setError(msg.length > 200 ? `${msg.slice(0, 200)}…` : msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-12">
      <div className="nb-card bg-white p-8 shadow-brutal-lg">
        <span className="nb-tag bg-sage-light text-sage border-sage/40 text-[9px] mb-4">Step 1 of 1</span>
        <h2 className="font-display text-2xl font-extrabold text-charcoal mb-2">Register your worker identity</h2>
        <p className="text-charcoal/55 text-sm leading-relaxed mb-6">
          Choose a public handle and verify your phone. The phone is hashed locally — Alora never sees the number itself, just a 32-byte
          fingerprint that lets future employers find your record.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-charcoal/40 font-display font-semibold mb-2">Handle</label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              maxLength={30}
              placeholder="e.g. ravi_freelance"
              className="w-full px-4 py-3 border-[2.5px] border-charcoal/15 focus:border-charcoal rounded-lg bg-cream focus:outline-none transition-colors font-mono text-sm"
            />
            <div className="text-[11px] text-charcoal/40 mt-1">4–30 characters. Visible to anyone who queries your record.</div>
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.2em] uppercase text-charcoal/40 font-display font-semibold mb-2">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-3 border-[2.5px] border-charcoal/15 focus:border-charcoal rounded-lg bg-cream focus:outline-none transition-colors font-mono text-sm"
            />
            <div className="text-[11px] text-charcoal/40 mt-1">
              Hashed locally before submission. V1 stub — real OTP verification ships in Phase 7.
            </div>
          </div>

          {error && <div className="border-[2px] border-terra/30 bg-terra-light text-terra text-xs px-3 py-2 rounded-lg">{error}</div>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="nb-btn bg-terra text-cream w-full py-4 font-display font-bold tracking-wide uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Registering…' : 'Register on Algorand'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default RegisterWorker
