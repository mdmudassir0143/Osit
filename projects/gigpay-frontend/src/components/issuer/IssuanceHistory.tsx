import React from 'react'
import { AttestationRecord, CATEGORY_LABELS, revokeAttestation } from '../../services/attestations'
import { bytesToHex } from '../../services/vault'
import { useWallet } from '@txnlab/use-wallet-react'
import { appUrl } from '../../services/explorer'
import { getAppIds } from '../../services/algorand'

interface Props {
  history: AttestationRecord[]
  loading: boolean
  onChanged: () => void
}

const truncate = (s: string, head = 6, tail = 4) => (s.length > head + tail + 3 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s)

const IssuanceHistory: React.FC<Props> = ({ history, loading, onChanged }) => {
  const { activeAddress, transactionSigner } = useWallet()

  const onRevoke = async (attId: Uint8Array) => {
    if (!activeAddress || !transactionSigner) return
    try {
      await revokeAttestation({
        sender: activeAddress,
        signer: transactionSigner,
        attId,
      })
      onChanged()
    } catch (err) {
      console.error('Revoke failed', err)
    }
  }

  return (
    <div className="nb-card bg-white rounded-2xl p-6 md:p-8 shadow-brutal">
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="nb-tag bg-cream text-charcoal/60 border-charcoal/15 text-[9px] mb-2">Issuance History</span>
          <h3 className="font-display text-xl font-bold text-charcoal mt-1">Attestations you've issued</h3>
        </div>
        <button
          onClick={onChanged}
          className="text-[11px] font-display font-semibold tracking-wide uppercase text-charcoal/55 hover:text-charcoal transition-colors"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-charcoal/45 text-sm py-6 text-center">Loading…</div>
      ) : history.length === 0 ? (
        <div className="bg-cream rounded-xl p-6 text-center">
          <div className="text-charcoal/55 text-sm mb-1">No attestations issued yet</div>
          <div className="text-charcoal/35 text-xs">Use the form above to issue your first attestation.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {history.map((att) => {
            const issued = new Date(Number(att.issuedAt) * 1000)
            return (
              <div key={Array.from(att.id).join('')} className="nb-card bg-white rounded-xl p-5 shadow-brutal-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/40 font-display font-semibold">
                    {CATEGORY_LABELS[att.category] || 'Unknown'}
                  </div>
                  {att.revoked && <span className="nb-tag bg-terra-light text-terra border-terra/40 text-[9px]">Revoked</span>}
                </div>
                <div className="text-xs text-charcoal/60 font-mono mb-1">Subject: {truncate(att.subject, 8, 6)}</div>
                <div className="text-xs text-charcoal/45 font-mono mb-3">{issued.toLocaleString()}</div>
                <div className="flex items-center gap-3 text-[11px] text-charcoal/40 mb-3">
                  <span>weight: {att.weight}</span>
                  <span>id: {bytesToHex(att.id).slice(0, 12)}…</span>
                </div>
                <a
                  href={appUrl(getAppIds().attestationLog)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-display font-semibold tracking-wide uppercase text-charcoal/50 hover:text-charcoal transition-colors mr-4"
                >
                  On-chain ↗
                </a>
                {!att.revoked && (
                  <button
                    onClick={() => onRevoke(att.id)}
                    className="text-[11px] font-display font-semibold tracking-wide uppercase text-terra hover:text-terra-dark transition-colors"
                  >
                    Revoke
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default IssuanceHistory
