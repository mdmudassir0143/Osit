import React, { useEffect, useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSearchParams } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import ConnectWallet from '../components/ConnectWallet'
import AloraLogo from '../components/shared/AloraLogo'
import IssueAttestationForm from '../components/issuer/IssueAttestationForm'
import IssuanceHistory from '../components/issuer/IssuanceHistory'
import WorkforceRoster, { IssuePrefill } from '../components/issuer/WorkforceRoster'
import BenefitsPanel from '../components/issuer/BenefitsPanel'
import CapitalPartners from '../components/issuer/CapitalPartners'
import { AttestationRecord, listByIssuer } from '../services/attestations'

const IssuerDashboard: React.FC = () => {
  const { activeAddress } = useWallet()
  const [searchParams, setSearchParams] = useSearchParams()
  const [walletModal, setWalletModal] = useState(false)
  const [history, setHistory] = useState<AttestationRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [prefill, setPrefill] = useState<IssuePrefill | null>(null)

  // QR-code-driven prefill: /issuer?subject=<address> opens the form with
  // that subject already populated, so an employer scanning a worker's QR
  // lands ready to issue.
  useEffect(() => {
    const subject = searchParams.get('subject')
    if (subject) {
      setPrefill({ subject })
      // Strip the param so the prefill effect doesn't re-fire on every
      // re-render.
      const next = new URLSearchParams(searchParams)
      next.delete('subject')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const uniqueWorkers = new Set(history.map((a) => a.subject)).size

  const triggerIssue = (p: IssuePrefill) => {
    // New object reference each call so the form's useEffect re-fires
    // even on repeat clicks with identical content.
    setPrefill({ ...p })
  }

  useEffect(() => {
    if (!activeAddress) return
    let cancelled = false
    setLoading(true)
    listByIssuer(activeAddress, activeAddress)
      .then((atts) => {
        if (!cancelled) setHistory(atts)
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
          <p className="text-charcoal/55 text-sm mb-8 leading-relaxed">
            Connect your wallet to issue signed attestations about workers you've engaged.
          </p>
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

  return (
    <DashboardLayout title="Issuer">
      <div className="space-y-6">
        <IssueAttestationForm onIssued={() => setRefreshKey((k) => k + 1)} prefill={prefill} />
        <WorkforceRoster history={history} loading={loading} onIssue={triggerIssue} />
        <BenefitsPanel workerCount={uniqueWorkers} onIssue={triggerIssue} />
        <CapitalPartners />
        <IssuanceHistory history={history} loading={loading} onChanged={() => setRefreshKey((k) => k + 1)} />
      </div>
    </DashboardLayout>
  )
}

export default IssuerDashboard
