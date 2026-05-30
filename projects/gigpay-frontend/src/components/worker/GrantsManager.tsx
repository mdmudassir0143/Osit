import React, { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import algosdk from 'algosdk'
import { CATEGORY_LABELS } from '../../services/attestations'
import { grantAccess, revokeAccess } from '../../services/grants'

const ALL_CATEGORIES = [1, 2, 3, 4, 5]

interface Props {
  onChanged: () => void
}

const GrantsManager: React.FC<Props> = ({ onChanged }) => {
  const { activeAddress, transactionSigner } = useWallet()
  const [consumer, setConsumer] = useState('')
  const [scope, setScope] = useState<number[]>(ALL_CATEGORIES)
  const [submitting, setSubmitting] = useState(false)
  const [revokeAddr, setRevokeAddr] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const consumerValid = consumer.length === 58 && algosdk.isValidAddress(consumer)
  const revokeValid = revokeAddr.length === 58 && algosdk.isValidAddress(revokeAddr)

  const toggleScope = (cat: number) => {
    setScope((s) => (s.includes(cat) ? s.filter((c) => c !== cat) : [...s, cat]))
  }

  const bitmask = scope.reduce((acc, cat) => acc | (1 << (cat - 1)), 0)

  const onGrant = async () => {
    if (!consumerValid || !activeAddress || !transactionSigner) return
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      await grantAccess({
        sender: activeAddress,
        signer: transactionSigner,
        consumer,
        scopeBitmask: bitmask,
        expiresAt: 0n,
        queryLimit: 0,
      })
      setSuccess(`Access granted to ${consumer.slice(0, 10)}…`)
      setConsumer('')
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message.slice(0, 200) : 'Grant failed')
    } finally {
      setSubmitting(false)
    }
  }

  const onRevoke = async () => {
    if (!revokeValid || !activeAddress || !transactionSigner) return
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    try {
      await revokeAccess({
        sender: activeAddress,
        signer: transactionSigner,
        consumer: revokeAddr,
      })
      setSuccess(`Access revoked from ${revokeAddr.slice(0, 10)}…`)
      setRevokeAddr('')
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message.slice(0, 200) : 'Revoke failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="nb-card bg-white rounded-2xl p-6 md:p-8 shadow-brutal-sun">
      <div className="mb-5">
        <h3 className="font-display text-xl font-bold text-charcoal mt-1">Manage access grants</h3>
        <p className="text-charcoal/50 text-sm mt-1">Authorize specific consumers to query your attestations. Revocable any time.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[12px] tracking-[0.08em] uppercase text-charcoal/40 font-display font-semibold mb-2">
            Consumer wallet
          </label>
          <input
            type="text"
            value={consumer}
            onChange={(e) => setConsumer(e.target.value.trim())}
            placeholder="58-character Algorand address"
            className="w-full px-3 py-2 border border-charcoal/15 focus:border-charcoal/15 rounded-lg bg-cream font-mono text-xs focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[12px] tracking-[0.08em] uppercase text-charcoal/40 font-display font-semibold mb-2">
            Categories accessible
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleScope(cat)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-mono font-semibold border-[1.5px] transition-colors ${
                  scope.includes(cat) ? 'bg-sage-light text-sage border-sage/50' : 'bg-cream text-charcoal/45 border-charcoal/15'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onGrant}
          disabled={!consumerValid || scope.length === 0 || submitting}
          className="nb-btn bg-terra text-cream w-full py-3 text-xs font-display font-bold tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Working…' : 'Grant Access'}
        </button>
      </div>

      <div className="mt-6 pt-5 border-t-[1.5px] border-dashed border-charcoal/15">
        <div className="text-[12px] tracking-[0.08em] uppercase text-charcoal/40 font-display font-semibold mb-2">Revoke</div>
        <div className="flex gap-2">
          <input
            type="text"
            value={revokeAddr}
            onChange={(e) => setRevokeAddr(e.target.value.trim())}
            placeholder="Consumer to revoke"
            className="flex-1 px-3 py-2 border border-charcoal/15 focus:border-charcoal/15 rounded-lg bg-cream font-mono text-xs focus:outline-none"
          />
          <button
            onClick={onRevoke}
            disabled={!revokeValid || submitting}
            className="nb-btn bg-charcoal text-cream px-4 py-2 text-[12px] font-display font-bold tracking-widest uppercase disabled:opacity-50"
          >
            Revoke
          </button>
        </div>
      </div>

      {error && <div className="mt-4 border border-terra/30 bg-terra-light text-terra text-xs px-3 py-2 rounded-lg">{error}</div>}
      {success && <div className="mt-4 border border-sage/40 bg-sage-light text-sage text-xs px-3 py-2 rounded-lg">{success}</div>}
    </div>
  )
}

export default GrantsManager
