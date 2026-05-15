import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import algosdk from 'algosdk'
import AloraLogo from '../components/shared/AloraLogo'
import AuraCard from '../components/worker/AuraCard'
import AuraScoreBreakdown from '../components/worker/AuraScoreBreakdown'
import AttestationsList from '../components/worker/AttestationsList'
import TrustGraph from '../components/worker/TrustGraph'
import { computeAuraScore } from '../services/score'
import { getWorkerProfile, WorkerProfile } from '../services/registry'
import { AttestationRecord, listBySubject } from '../services/attestations'
import { getPublicViewer } from '../services/algorand'
import { addressUrl } from '../services/explorer'

const truncate = (s: string, head = 6, tail = 4) =>
  s.length > head + tail + 3 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s

const PublicWorker: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const viewer = getPublicViewer()
  const [profile, setProfile] = useState<WorkerProfile | null>(null)
  const [attestations, setAttestations] = useState<AttestationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [address, setAddress] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    const trimmed = id.trim()
    const isAddress = trimmed.length === 58 && algosdk.isValidAddress(trimmed)
    if (!isAddress) {
      setError('Invalid worker identifier. Expected an Algorand address.')
      setLoading(false)
      return
    }
    setAddress(trimmed)
    Promise.all([getWorkerProfile(trimmed), listBySubject(trimmed, viewer)])
      .then(([p, atts]) => {
        setProfile(p)
        setAttestations(atts)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load worker')
      })
      .finally(() => setLoading(false))
  }, [id, viewer])

  return (
    <div className="min-h-screen bg-cream text-charcoal font-sans">
      <div className="noise-overlay" />

      {/* Slim public nav */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 lg:px-20 py-5 border-b-[2.5px] border-charcoal bg-cream">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <AloraLogo size="md" />
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline font-mono text-[10px] tracking-[0.25em] uppercase text-charcoal/45">
            Public Worker Record
          </span>
          <Link
            to="/worker"
            className="nb-btn bg-terra text-cream px-5 py-2.5 text-sm font-display font-bold uppercase"
          >
            Get my Aura →
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 md:px-12 py-10">
        {loading && <div className="text-charcoal/45 text-center py-20">Loading record…</div>}

        {error && (
          <div className="nb-card bg-white p-8 shadow-brutal text-center">
            <div className="font-display text-xl font-bold text-charcoal mb-2">Couldn't load this record</div>
            <div className="text-sm text-charcoal/55 mb-4">{error}</div>
            <Link to="/" className="font-mono text-[11px] tracking-widest uppercase text-terra hover:text-terra-dark">
              Back home
            </Link>
          </div>
        )}

        {!loading && !error && address && (!profile || !profile.registered) && (
          <div className="nb-card bg-white p-8 shadow-brutal text-center">
            <span className="nb-tag bg-cream text-charcoal/60 border-charcoal/15 text-[9px] mb-3">Not registered</span>
            <div className="font-display text-xl font-bold text-charcoal mt-3 mb-2">
              No Alora record for this address yet.
            </div>
            <div className="text-sm text-charcoal/55 mb-4">
              <a
                href={addressUrl(address)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-terra hover:text-terra-dark"
              >
                {truncate(address, 8, 6)} ↗
              </a>{' '}
              hasn't registered on Alora. Workers register at <Link to="/worker" className="text-terra hover:text-terra-dark">/worker</Link>.
            </div>
          </div>
        )}

        {!loading && !error && profile?.registered && address && (
          <div className="space-y-6">
            {/* Banner CTA */}
            <div className="nb-card bg-charcoal text-cream rounded-2xl p-5 md:p-6 shadow-brutal flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <span className="nb-tag bg-cream/10 text-cream/65 border-cream/15 text-[9px] mb-1">Verified · On-chain</span>
                <h1 className="font-display text-xl md:text-2xl font-extrabold mt-1">
                  This is <span className="text-terra">@{profile.handle}</span>'s portable work record.
                </h1>
                <p className="text-cream/55 text-sm mt-1">
                  Every attestation here was signed by an employer or client and recorded to Algorand. Verifiable by anyone.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  to="/issuer"
                  className="nb-btn bg-terra text-cream px-4 py-2 text-[11px] font-display font-bold tracking-widest uppercase"
                >
                  Attest →
                </Link>
              </div>
            </div>

            <AuraCard address={address} profile={profile} attestations={attestations} />

            <div className="text-center pt-6 text-[11px] font-mono text-charcoal/35">
              Built on Algorand · Worker-owned · {attestations.length} attestation{attestations.length === 1 ? '' : 's'} on-chain
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PublicWorker
