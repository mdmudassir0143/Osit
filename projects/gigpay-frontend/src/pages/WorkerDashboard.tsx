import React, { useEffect, useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import DashboardLayout from '../layouts/DashboardLayout'
import ConnectWallet from '../components/ConnectWallet'
import AloraLogo from '../components/shared/AloraLogo'
import RegisterWorker from '../components/worker/RegisterWorker'
import WorkerProfileCard from '../components/worker/WorkerProfile'
import AuraCard from '../components/worker/AuraCard'
import AuraScoreBreakdown from '../components/worker/AuraScoreBreakdown'
import AttestationsList from '../components/worker/AttestationsList'
import GrantsManager from '../components/worker/GrantsManager'
import { computeAuraScore } from '../services/score'
import { getWorkerProfile, WorkerProfile } from '../services/registry'
import { AttestationRecord, listBySubject } from '../services/attestations'

const WorkerDashboard: React.FC = () => {
  const { activeAddress } = useWallet()
  const [walletModal, setWalletModal] = useState(false)
  const [profile, setProfile] = useState<WorkerProfile | null>(null)
  const [attestations, setAttestations] = useState<AttestationRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!activeAddress) return
    let cancelled = false
    setLoading(true)
    Promise.all([getWorkerProfile(activeAddress), listBySubject(activeAddress, activeAddress)])
      .then(([p, atts]) => {
        if (cancelled) return
        setProfile(p)
        setAttestations(atts)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeAddress, refreshKey])

  if (!activeAddress) {
    return (
      <div className="min-h-screen bg-cream text-charcoal font-sans flex items-center justify-center">
        <div className="noise-overlay" />
        <div className="nb-card max-w-md w-full mx-6 p-10 text-center shadow-brutal-lg">
          <div className="flex justify-center mb-6">
            <AloraLogo size="lg" />
          </div>
          <p className="text-charcoal/55 text-sm mb-8 leading-relaxed">Connect your Algorand wallet to access your worker record.</p>
          <button
            onClick={() => setWalletModal(true)}
            className="nb-btn bg-terra text-cream w-full py-3 text-sm font-display font-bold tracking-widest uppercase"
          >
            Connect Wallet
          </button>
          <a href="/" className="block text-xs font-display font-semibold text-charcoal/40 hover:text-charcoal transition-colors mt-6">
            ← Back to home
          </a>
          <ConnectWallet openModal={walletModal} closeModal={() => setWalletModal(false)} />
        </div>
      </div>
    )
  }

  if (loading && !profile) {
    return (
      <DashboardLayout title="Worker">
        <div className="text-charcoal/45 text-sm py-12 text-center">Loading your record…</div>
      </DashboardLayout>
    )
  }

  if (!profile?.registered) {
    return (
      <DashboardLayout title="Worker">
        <RegisterWorker onRegistered={() => setRefreshKey((k) => k + 1)} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Worker">
      <div className="space-y-6">
        <AuraCard address={activeAddress} profile={profile} attestations={attestations} />
        <AuraScoreBreakdown breakdown={computeAuraScore(attestations, profile.registeredAt)} />
        <WorkerProfileCard address={activeAddress} profile={profile} />
        <AttestationsList attestations={attestations} loading={loading} onRefresh={() => setRefreshKey((k) => k + 1)} />
        <GrantsManager onChanged={() => setRefreshKey((k) => k + 1)} />
      </div>
    </DashboardLayout>
  )
}

export default WorkerDashboard
