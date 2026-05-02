import React, { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import DashboardLayout from '../layouts/DashboardLayout'
import ConnectWallet from '../components/ConnectWallet'
import AloraLogo from '../components/shared/AloraLogo'
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
            Connect your wallet to query worker attestations. (V1: free; Phase 5 adds subscription gating via the read-API gateway.)
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
        <div className="nb-card bg-charcoal rounded-2xl p-6 md:p-8 shadow-brutal text-cream">
          <span className="nb-tag bg-cream/10 text-cream/60 border-cream/15 text-[9px] mb-2">Phase 5 stub</span>
          <h2 className="font-display text-xl font-extrabold mt-2 mb-1">Direct on-chain reads (V1)</h2>
          <p className="text-cream/55 text-sm leading-relaxed">
            In V1, queries hit Algorand directly. The hosted read-API gateway with subscription billing arrives in Phase 5. Until then, your
            wallet IS your API key — just request grants from workers and query below.
          </p>
        </div>
        <QueryConsole />
      </div>
    </DashboardLayout>
  )
}

export default ConsumerDashboard
