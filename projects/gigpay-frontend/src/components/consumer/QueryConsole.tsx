import React, { useState } from 'react'
import algosdk from 'algosdk'
import { useWallet } from '@txnlab/use-wallet-react'
import { AttestationRecord, CATEGORY_LABELS, listBySubject } from '../../services/attestations'
import { fetchPayload, AttestationPayload, bytesToHex } from '../../services/vault'
import { isValidPhone, verifyAndHash } from '../../services/phone'
import { lookupByPhoneHash } from '../../services/registry'
import { GrantRecord, checkGrant, isGrantValid } from '../../services/grants'

interface ResultRow {
  att: AttestationRecord
  payload: AttestationPayload | null
  accessible: boolean
}

const truncate = (s: string, head = 6, tail = 4) => (s.length > head + tail + 3 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s)

const QueryConsole: React.FC = () => {
  const { activeAddress } = useWallet()
  const [subjectInput, setSubjectInput] = useState('')
  const [results, setResults] = useState<ResultRow[] | null>(null)
  const [grant, setGrant] = useState<GrantRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onQuery = async () => {
    if (!activeAddress || !subjectInput) return
    setLoading(true)
    setError(null)
    setResults(null)
    setGrant(null)
    try {
      let workerAddr = subjectInput.trim()
      const isAddr = workerAddr.length === 58 && algosdk.isValidAddress(workerAddr)
      if (!isAddr) {
        if (!isValidPhone(workerAddr)) {
          throw new Error('Enter a valid wallet address or phone number')
        }
        const phoneHash = await verifyAndHash(workerAddr)
        const found = await lookupByPhoneHash(phoneHash, activeAddress)
        if (!found) throw new Error('Worker not found by that phone')
        workerAddr = found
      }

      const [theGrant, atts] = await Promise.all([
        checkGrant({ worker: workerAddr, consumer: activeAddress, sender: activeAddress }),
        listBySubject(workerAddr, activeAddress),
      ])
      setGrant(theGrant)

      const now = BigInt(Math.floor(Date.now() / 1000))
      const rows: ResultRow[] = await Promise.all(
        atts.map(async (att) => {
          const accessible = isGrantValid(theGrant, att.category, now)
          const payload = accessible ? await fetchPayload(att.contentCid) : null
          return { att, payload, accessible }
        }),
      )
      setResults(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="nb-card bg-white rounded-2xl p-6 md:p-8 shadow-brutal-lavender">
      <div className="mb-5">
        <span className="nb-tag bg-lavender/30 text-charcoal border-lavender/50 text-[9px] mb-2">Query</span>
        <h3 className="font-display text-xl font-bold text-charcoal mt-1">Query a worker's attestations</h3>
        <p className="text-charcoal/50 text-sm mt-1">
          The worker must grant your wallet access first. Without a grant, you'll see attestation metadata but not the encrypted claims.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-2 mb-5">
        <input
          type="text"
          value={subjectInput}
          onChange={(e) => setSubjectInput(e.target.value)}
          placeholder="Worker wallet address or phone"
          className="flex-1 px-3 py-2 border-[2px] border-charcoal/15 focus:border-charcoal rounded-lg bg-cream font-mono text-xs focus:outline-none"
        />
        <button
          onClick={onQuery}
          disabled={!subjectInput || loading || !activeAddress}
          className="nb-btn bg-terra text-cream px-6 py-2 text-xs font-display font-bold tracking-widest uppercase disabled:opacity-50"
        >
          {loading ? 'Querying…' : 'Query'}
        </button>
      </div>

      {error && <div className="border-[2px] border-terra/30 bg-terra-light text-terra text-xs px-3 py-2 rounded-lg mb-4">{error}</div>}

      {grant && results && (
        <div className="space-y-3">
          <div className="bg-cream rounded-lg p-3 border-[1.5px] border-charcoal/10 text-xs">
            <div className="font-display font-semibold mb-1">
              Grant status: {grant.exists ? <span className="text-sage">Active</span> : <span className="text-terra">No grant</span>}
            </div>
            {grant.exists && (
              <div className="text-charcoal/55 font-mono">
                Scope mask: 0b{grant.scopeBitmask.toString(2).padStart(5, '0')}
                {grant.expiresAt > 0n && (
                  <>
                    {' · '}expires {new Date(Number(grant.expiresAt) * 1000).toLocaleDateString()}
                  </>
                )}
              </div>
            )}
          </div>

          {results.length === 0 ? (
            <div className="bg-cream rounded-xl p-6 text-center text-charcoal/45 text-sm">No attestations exist for this subject.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {results.map((row) => {
                const issued = new Date(Number(row.att.issuedAt) * 1000)
                return (
                  <div key={Array.from(row.att.id).join('')} className="nb-card bg-white rounded-xl p-4 shadow-brutal-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-[10px] tracking-[0.2em] uppercase text-charcoal/40 font-display font-semibold">
                        {CATEGORY_LABELS[row.att.category]}
                      </div>
                      {!row.accessible && (
                        <span className="nb-tag bg-charcoal/10 text-charcoal/55 border-charcoal/15 text-[9px]">No Access</span>
                      )}
                      {row.att.revoked && <span className="nb-tag bg-terra-light text-terra border-terra/40 text-[9px]">Revoked</span>}
                    </div>
                    <div className="text-xs text-charcoal/55 font-mono mb-1">Issuer: {truncate(row.att.issuer, 8, 6)}</div>
                    <div className="text-xs text-charcoal/45 font-mono mb-2">{issued.toLocaleString()}</div>
                    {row.accessible && row.payload ? (
                      <div className="bg-cream rounded-md px-3 py-2 mt-2 text-sm text-charcoal/80">
                        {row.payload.claim}
                        {typeof row.payload.rating === 'number' && (
                          <div className="text-xs text-charcoal/45 mt-1">Rating: {row.payload.rating} / 5</div>
                        )}
                      </div>
                    ) : !row.accessible ? (
                      <div className="text-xs text-charcoal/40 italic">Request a grant from the worker to read this claim.</div>
                    ) : (
                      <div className="text-xs text-charcoal/40 italic">Payload not in local vault stub.</div>
                    )}
                    <div className="text-[10px] text-charcoal/35 font-mono mt-2">id: {bytesToHex(row.att.id).slice(0, 12)}…</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default QueryConsole
