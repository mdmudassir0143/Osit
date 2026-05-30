import React, { useEffect, useState } from 'react'
import { AttestationRecord, CATEGORY_LABELS } from '../../services/attestations'
import { fetchPayload, AttestationPayload } from '../../services/vault'
import { bytesToHex } from '../../services/vault'
import { appUrl } from '../../services/explorer'
import { getAppIds } from '../../services/algorand'

interface Props {
  attestations: AttestationRecord[]
  loading: boolean
  onRefresh: () => void
}

const truncate = (s: string, head = 6, tail = 4) => (s.length > head + tail + 3 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s)

const categoryAccent = (cat: number): string => {
  switch (cat) {
    case 1:
      return 'bg-sage'
    case 2:
      return 'bg-sun'
    case 3:
      return 'bg-terra'
    case 4:
      return 'bg-lavender'
    default:
      return 'bg-cream'
  }
}

const AttestationCard: React.FC<{ att: AttestationRecord }> = ({ att }) => {
  const [open, setOpen] = useState(false)
  const [payload, setPayload] = useState<AttestationPayload | null>(null)

  useEffect(() => {
    if (open && !payload) {
      fetchPayload(att.contentCid).then((p) => setPayload(p))
    }
  }, [open, payload, att.contentCid])

  const issuedDate = new Date(Number(att.issuedAt) * 1000)
  const isExpired = att.validUntil > 0n && att.validUntil < BigInt(Math.floor(Date.now() / 1000))

  return (
    <div className="nb-card bg-white rounded-xl p-5 shadow-brutal-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div
            className={`inline-flex items-center gap-2 px-2 py-1 rounded-md ${categoryAccent(
              att.category,
            )}/20 text-charcoal text-[12px] font-mono font-semibold uppercase tracking-wider`}
          >
            <span className={`w-2 h-2 rounded-full ${categoryAccent(att.category)} border border-charcoal/40`} />
            {CATEGORY_LABELS[att.category] || 'Unknown'}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {att.revoked && <span className="nb-tag bg-terra-light text-terra border-terra/40 text-[11px]">Revoked</span>}
          {isExpired && !att.revoked && (
            <span className="nb-tag bg-charcoal/10 text-charcoal/60 border-charcoal/20 text-[11px]">Expired</span>
          )}
        </div>
      </div>
      <div className="text-xs text-charcoal/45 font-mono mb-1">Issued by {truncate(att.issuer, 8, 6)}</div>
      <div className="text-xs text-charcoal/45 font-mono mb-3">{issuedDate.toLocaleString()}</div>
      <div className="flex items-center gap-3 text-[12px] text-charcoal/40">
        <span>weight: {att.weight}</span>
        <span>id: {bytesToHex(att.id).slice(0, 12)}…</span>
      </div>
      <div className="flex items-center gap-4 mt-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-[12px] font-display font-semibold tracking-wide uppercase text-terra hover:text-terra-dark transition-colors"
        >
          {open ? 'Hide claim' : 'View claim'}
        </button>
        <a
          href={appUrl(getAppIds().attestationLog)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] font-display font-semibold tracking-wide uppercase text-charcoal/50 hover:text-charcoal transition-colors"
        >
          On-chain ↗
        </a>
      </div>
      {open && (
        <div className="mt-3 pt-3 border-t-[1.5px] border-dashed border-charcoal/15">
          {payload ? (
            <div className="text-sm text-charcoal/80 leading-relaxed">
              {payload.claim}
              {typeof payload.rating === 'number' && <div className="mt-1 text-xs text-charcoal/45">Rating: {payload.rating} / 5</div>}
            </div>
          ) : (
            <div className="text-xs text-charcoal/40 italic">Claim payload not found in local vault stub.</div>
          )}
        </div>
      )}
    </div>
  )
}

const AttestationsList: React.FC<Props> = ({ attestations, loading, onRefresh }) => {
  return (
    <div className="nb-card bg-white rounded-2xl p-6 md:p-8 shadow-brutal">
      <div className="flex items-center justify-between mb-5">
        <div>
          <span className="nb-tag bg-cream text-charcoal/60 border-charcoal/15 text-[11px] mb-2">Attestations Received</span>
          <h3 className="font-display text-xl font-bold text-charcoal mt-1">Your work history</h3>
        </div>
        <button
          onClick={onRefresh}
          className="text-[12px] font-display font-semibold tracking-wide uppercase text-charcoal/55 hover:text-charcoal transition-colors"
        >
          Refresh
        </button>
      </div>
      {loading ? (
        <div className="text-charcoal/45 text-sm py-6 text-center">Loading…</div>
      ) : attestations.length === 0 ? (
        <div className="bg-cream rounded-xl p-6 text-center">
          <div className="text-charcoal/55 text-sm mb-1">No attestations yet</div>
          <div className="text-charcoal/35 text-xs">
            Share your wallet address with employers, clients, or trainers — anyone can issue an attestation about you.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attestations.map((att) => (
            <AttestationCard key={Array.from(att.id).join('')} att={att} />
          ))}
        </div>
      )}
    </div>
  )
}

export default AttestationsList
