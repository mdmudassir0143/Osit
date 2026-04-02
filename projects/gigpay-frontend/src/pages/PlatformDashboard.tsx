import React, { useCallback, useEffect, useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { Navigate } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import ConnectWallet from '../components/ConnectWallet'
import EscrowStatus from '../components/platform/EscrowStatus'
import EscrowDeposit from '../components/platform/EscrowDeposit'
import WorkerList from '../components/platform/WorkerList'
import AddWorkerForm from '../components/platform/AddWorkerForm'
import CreateDelivery from '../components/platform/CreateDelivery'
import DeliveryTracker from '../components/platform/DeliveryTracker'
import TransactionFeed from '../components/platform/TransactionFeed'
import { usePlatformData } from '../hooks/usePlatformData'

const USDC_ASSET_ID = Number(import.meta.env.VITE_USDC_ASSET_ID) || 0
const ADMIN_ADDRESS = import.meta.env.VITE_ADMIN_ADDRESS || ''

type Tab = 'overview' | 'workers' | 'deliveries'

const PlatformDashboard: React.FC = () => {
  const { activeAddress } = useWallet()
  const [refreshKey, setRefreshKey] = useState(0)
  const [walletModal, setWalletModal] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const { workers, deliveries, escrow, loading } = usePlatformData(refreshKey)

  // Optimistic status overrides — persists across tab switches
  const [statusOverrides, setStatusOverrides] = useState<Record<number, number>>({})

  const handleStatusOverride = useCallback((id: number, status: number) => {
    setStatusOverrides((prev) => ({ ...prev, [id]: status }))
  }, [])

  // Clear overrides once chain data catches up
  useEffect(() => {
    setStatusOverrides((prev) => {
      const next: Record<number, number> = {}
      for (const [id, override] of Object.entries(prev)) {
        const delivery = deliveries.find((d) => d.id === Number(id))
        if (delivery && delivery.status < override) {
          next[Number(id)] = override
        }
      }
      return Object.keys(next).length === Object.keys(prev).length ? prev : next
    })
  }, [deliveries])

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1)
    setTimeout(() => setRefreshKey((k) => k + 1), 4000)
  }

  if (!activeAddress) {
    return (
      <div className="min-h-screen bg-surface text-charcoal font-sans flex items-center justify-center">
        <div className="max-w-md w-full mx-6 bg-surface-raised border border-border rounded-lg p-10 text-center shadow-sm">
          <div className="w-3 h-3 bg-terra mx-auto mb-6 rounded-sm" />
          <h1 className="font-serif text-3xl mb-3">GigPay</h1>
          <p className="text-muted text-sm mb-8 leading-relaxed">
            Connect your Algorand wallet to access the merchant dashboard.
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

  // Only admin/deployer can access the merchant dashboard
  if (activeAddress !== ADMIN_ADDRESS) {
    return <Navigate to="/worker" />
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'workers', label: 'Workers', count: workers.length },
    { key: 'deliveries', label: 'Deliveries', count: deliveries.length },
  ]

  return (
    <DashboardLayout title="Merchant Dashboard">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-6 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-terra text-charcoal'
                : 'border-transparent text-muted hover:text-charcoal'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-[10px] bg-surface border border-border rounded px-1.5 py-0.5">
                {tab.count}
              </span>
            )}
          </button>
        ))}

        {loading && (
          <div className="ml-auto flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-border border-t-terra animate-spin rounded-full" />
            <span className="text-xs text-muted">Syncing...</span>
          </div>
        )}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EscrowStatus
              balance={escrow.balance}
              totalDeposited={escrow.totalDeposited}
              totalReleased={escrow.totalReleased}
              appAddress={escrow.appAddress}
              usdcOptedIn={escrow.usdcOptedIn}
            />
            <EscrowDeposit usdcAssetId={USDC_ASSET_ID} onDeposited={handleRefresh} />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-surface-raised border border-border rounded-lg p-5">
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-1">Active Workers</div>
              <div className="font-serif text-2xl text-charcoal">{workers.filter((w) => w.status === 1).length}</div>
            </div>
            <div className="bg-surface-raised border border-border rounded-lg p-5">
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-1">Open Deliveries</div>
              <div className="font-serif text-2xl text-charcoal">{deliveries.filter((d) => d.status < 3).length}</div>
            </div>
            <div className="bg-surface-raised border border-border rounded-lg p-5">
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-1">Completed</div>
              <div className="font-serif text-2xl text-sage">{deliveries.filter((d) => d.status === 3).length}</div>
            </div>
            <div className="bg-surface-raised border border-border rounded-lg p-5">
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-1">Avg Rating</div>
              <div className="font-serif text-2xl text-terra">
                {workers.length > 0
                  ? (workers.reduce((s, w) => s + w.rating, 0) / workers.length / 10).toFixed(1)
                  : '—'}
                {workers.length > 0 && <span className="text-sm ml-0.5">★</span>}
              </div>
            </div>
          </div>

          <TransactionFeed refreshKey={refreshKey} />
        </div>
      )}

      {/* Workers Tab */}
      {activeTab === 'workers' && (
        <div className="space-y-6">
          <AddWorkerForm onAdded={handleRefresh} />
          <WorkerList workers={workers} />
        </div>
      )}

      {/* Deliveries Tab */}
      {activeTab === 'deliveries' && (
        <div className="space-y-6">
          <CreateDelivery workers={workers} onCreated={handleRefresh} />
          <DeliveryTracker deliveries={deliveries} workers={workers} onUpdated={handleRefresh} statusOverrides={statusOverrides} onStatusOverride={handleStatusOverride} />
        </div>
      )}
    </DashboardLayout>
  )
}

export default PlatformDashboard
