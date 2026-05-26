import React, { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import DashboardLayout from '../layouts/DashboardLayout'
import ConnectWallet from '../components/ConnectWallet'
import AloraLogo from '../components/shared/AloraLogo'
import ConsumerHero from '../components/consumer/ConsumerHero'
import UseCasePersonas from '../components/consumer/UseCasePersonas'
import DataPointsPanel from '../components/consumer/DataPointsPanel'
import UnderwritingFlow from '../components/consumer/UnderwritingFlow'
import WorkerEmpowerment from '../components/consumer/WorkerEmpowerment'
import PricingPanel from '../components/consumer/PricingPanel'
import QueryConsole from '../components/consumer/QueryConsole'

const ConsumerDashboard: React.FC = () => {
  const { activeAddress } = useWallet()
  const [walletModal, setWalletModal] = useState(false)

  if (!activeAddress) {
    return (
      <div className="min-h-screen bg-cream text-charcoal font-sans flex items-center justify-center">
        <div className="noise-overlay" />
        <div className="nb-card max-w-md w-full mx-6 p-10 text-center shadow-brutal-lg">
          <div className="flex justify-center mb-6">
            <AloraLogo size="lg" />
          </div>
          <p className="text-charcoal/55 text-sm mb-8 leading-relaxed">
            Connect your wallet to query verified worker records. NBFCs, neo-banks, insurers, employers, landlords, and welfare
            agencies all query the same bureau API.
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
    <DashboardLayout title="Consumer">
      <div className="space-y-6">
        <ConsumerHero address={activeAddress} />

        {/* Sandbox callout — public API playground */}
        <div className="nb-card bg-white rounded-2xl p-5 md:p-6 shadow-brutal flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="nb-tag bg-cream text-charcoal/60 border-charcoal/15 text-[9px] mb-2">Try the API</span>
            <h3 className="font-display text-base md:text-lg font-bold text-charcoal mt-1">
              No-auth sandbox for your engineering team
            </h3>
            <p className="text-charcoal/55 text-[13px] mt-1 max-w-2xl">
              Share this link with your tech lead. They can paste a worker address and get the full JSON response, with copyable
              code snippets, in 30 seconds. No signup required.
            </p>
          </div>
          <a
            href="/sandbox"
            target="_blank"
            rel="noopener noreferrer"
            className="nb-btn bg-terra text-cream px-6 py-3 text-xs font-display font-bold tracking-widest uppercase shrink-0"
          >
            Open /sandbox ↗
          </a>
        </div>

        <UseCasePersonas />
        <DataPointsPanel />
        <UnderwritingFlow />
        <WorkerEmpowerment />
        <PricingPanel />
        <QueryConsole />
      </div>
    </DashboardLayout>
  )
}

export default ConsumerDashboard
