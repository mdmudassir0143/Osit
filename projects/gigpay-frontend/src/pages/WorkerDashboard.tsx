import React, { useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { Navigate } from 'react-router-dom'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import DashboardLayout from '../layouts/DashboardLayout'
import ConnectWallet from '../components/ConnectWallet'
import WorkerProfileCard from '../components/worker/WorkerProfile'
import EarningsCard from '../components/worker/EarningsCard'
import OfframpCard from '../components/worker/OfframpCard'
import DeliveryHistory from '../components/worker/DeliveryHistory'
import { useWorkerData } from '../hooks/useWorkerData'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

const ADMIN_ADDRESS = import.meta.env.VITE_ADMIN_ADDRESS || ''
const USDC_ASSET_ID = Number(import.meta.env.VITE_USDC_ASSET_ID) || 0

const WorkerDashboard: React.FC = () => {
  const { activeAddress, transactionSigner } = useWallet()
  const [refreshKey, setRefreshKey] = useState(0)
  const [walletModal, setWalletModal] = useState(false)
  const [optingIn, setOptingIn] = useState(false)
  const { profile, deliveries, usdcBalance, usdcOptedIn, loading } = useWorkerData(activeAddress || undefined, refreshKey)

  const handleOptInUsdc = async () => {
    if (!activeAddress) return
    setOptingIn(true)
    try {
      const algodConfig = getAlgodConfigFromViteEnvironment()
      const indexerConfig = getIndexerConfigFromViteEnvironment()
      const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig })
      algorand.setDefaultSigner(transactionSigner)
      await algorand.send.assetOptIn({
        sender: activeAddress,
        assetId: BigInt(USDC_ASSET_ID),
      })
      setRefreshKey((k) => k + 1)
    } catch (err: any) {
      console.error('USDC opt-in failed:', err)
    } finally {
      setOptingIn(false)
    }
  }

  if (!activeAddress) {
    return (
      <div className="min-h-screen bg-surface text-charcoal font-sans flex items-center justify-center">
        <div className="max-w-md w-full mx-6 bg-surface-raised border border-border rounded-lg p-10 text-center shadow-sm">
          <div className="w-3 h-3 bg-terra mx-auto mb-6 rounded-sm" />
          <h1 className="font-serif text-3xl mb-3">GigPay</h1>
          <p className="text-muted text-sm mb-8 leading-relaxed">
            Connect your Algorand wallet to access the worker dashboard.
          </p>

          <button
            onClick={() => setWalletModal(true)}
            className="bg-terra text-white px-8 py-3.5 text-sm font-medium tracking-wide uppercase hover:bg-terra-dark transition-all w-full rounded"
          >
            Connect Wallet
          </button>

          <a href="/" className="block text-xs text-muted hover:text-charcoal transition-colors mt-6">
            Back to home
          </a>

          <ConnectWallet openModal={walletModal} closeModal={() => setWalletModal(false)} />
        </div>
      </div>
    )
  }

  // Block admin from worker dashboard
  if (activeAddress === ADMIN_ADDRESS) return <Navigate to="/platform" />

  if (loading) {
    return (
      <DashboardLayout title="Worker Dashboard">
        <div className="flex items-center justify-center gap-3 py-12">
          <div className="w-4 h-4 border-2 border-border border-t-terra animate-spin rounded-full" />
          <span className="text-sm text-muted">Loading your data...</span>
        </div>
      </DashboardLayout>
    )
  }

  if (!profile) {
    return (
      <DashboardLayout title="Worker Dashboard">
        <div className="max-w-md mx-auto mt-12">
          <div className="bg-surface-raised border border-border rounded-lg p-8 text-center">
            <div className="w-10 h-10 bg-terra-light rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-terra text-lg">!</span>
            </div>
            <h2 className="font-serif text-xl text-charcoal mb-2">Not Registered</h2>
            <p className="text-muted text-sm leading-relaxed max-w-sm mx-auto">
              Your wallet is not registered as a worker. Please contact your merchant to be added to the platform.
            </p>
            <div className="mt-4 pt-4 border-t border-border-light">
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-1">Your Wallet</div>
              <div className="text-xs font-mono text-muted break-all">{activeAddress}</div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Worker Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!usdcOptedIn && (
          <div className="lg:col-span-2 bg-terra/5 border border-terra/20 rounded-lg p-5 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-charcoal mb-1">USDC Opt-In Required</div>
              <div className="text-xs text-muted">Your wallet needs to opt into USDC (ASA {USDC_ASSET_ID}) to receive payments from the escrow.</div>
            </div>
            <button
              onClick={handleOptInUsdc}
              disabled={optingIn}
              className="bg-terra text-white px-5 py-2.5 text-sm font-medium tracking-wide uppercase hover:bg-terra-dark transition-colors rounded disabled:opacity-30 flex items-center gap-2 shrink-0 ml-4"
            >
              {optingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                  Opting in...
                </>
              ) : (
                'Opt In to USDC'
              )}
            </button>
          </div>
        )}
        <WorkerProfileCard profile={profile} />
        <EarningsCard
          totalEarned={profile.totalEarned}
          tasksCompleted={profile.tasksCompleted}
          usdcBalance={usdcBalance}
          rating={profile.rating}
        />
        <div className="lg:col-span-2">
          <OfframpCard usdcBalance={usdcBalance} upiId={profile.upiId} />
        </div>
        <div className="lg:col-span-2">
          <DeliveryHistory deliveries={deliveries} />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default WorkerDashboard
