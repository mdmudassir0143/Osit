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
import Analytics from '../components/platform/Analytics'
import BulkUpload from '../components/platform/BulkUpload'
import ExportData from '../components/platform/ExportData'
import PendingWorkers from '../components/platform/PendingWorkers'
import ComplianceDashboard from '../components/platform/ComplianceDashboard'
import ComplianceLog from '../components/platform/ComplianceLog'
import AloraLogo from '../components/shared/AloraLogo'
import { usePlatformData } from '../hooks/usePlatformData'

const USDC_ASSET_ID = Number(import.meta.env.VITE_USDC_ASSET_ID) || 0
const ADMIN_ADDRESS = import.meta.env.VITE_ADMIN_ADDRESS || ''

type Tab = 'overview' | 'workers' | 'deliveries' | 'compliance' | 'analytics'

const PlatformDashboard: React.FC = () => {
  const { activeAddress } = useWallet()
  const [refreshKey, setRefreshKey] = useState(0)
  const [walletModal, setWalletModal] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const { workers, deliveries, applications, escrow, loading } = usePlatformData(refreshKey, activeAddress || undefined)

  const [statusOverrides, setStatusOverrides] = useState<Record<number, number>>({})

  const handleStatusOverride = useCallback((id: number, status: number) => {
    setStatusOverrides((prev) => ({ ...prev, [id]: status }))
  }, [])

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
      <div className="min-h-screen bg-cream text-charcoal font-sans flex items-center justify-center">
        <div className="noise-overlay" />
        <div className="nb-card max-w-md w-full mx-6 p-10 text-center shadow-brutal-lg">
          <div className="flex justify-center mb-6">
            <AloraLogo size="lg" />
          </div>
          <p className="text-muted text-sm mb-8 leading-relaxed">
            Connect your Algorand wallet to access the merchant dashboard.
          </p>

          <button
            onClick={() => setWalletModal(true)}
            className="nb-btn-primary"
          >
            Connect Wallet
          </button>

          <a href="/" className="block text-xs font-display font-semibold text-muted hover:text-charcoal transition-colors mt-6">
            Back to home
          </a>

          <ConnectWallet openModal={walletModal} closeModal={() => setWalletModal(false)} />
        </div>
      </div>
    )
  }

  if (activeAddress !== ADMIN_ADDRESS) {
    return <Navigate to="/worker" />
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'workers', label: 'Workers', count: workers.length },
    { key: 'deliveries', label: 'Deliveries', count: deliveries.length },
    { key: 'compliance', label: 'Compliance', count: deliveries.filter((d) => d.status === 3).length },
    { key: 'analytics', label: 'Analytics' },
  ]

  return (
    <DashboardLayout title="Merchant Dashboard">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-8 border-b-[2.5px] border-charcoal/10">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`nb-tab -mb-[2.5px] ${activeTab === tab.key ? 'nb-tab-active' : ''}`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-[10px] bg-charcoal text-white rounded-full px-2 py-0.5 font-mono">
                {tab.count}
              </span>
            )}
          </button>
        ))}

        {loading && (
          <div className="ml-auto flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-charcoal/20 border-t-terra animate-spin rounded-full" />
            <span className="text-xs text-muted font-display font-semibold">Syncing...</span>
          </div>
        )}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6 stagger-children">
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
            <div className="nb-stat-card">
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-1">Active Workers</div>
              <div className="font-display text-2xl font-bold text-charcoal">{workers.filter((w) => w.status === 1).length}</div>
            </div>
            <div className="nb-stat-card">
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-1">Open Deliveries</div>
              <div className="font-display text-2xl font-bold text-charcoal">{deliveries.filter((d) => d.status < 3).length}</div>
            </div>
            <div className="nb-stat-card">
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-1">Completed</div>
              <div className="font-display text-2xl font-bold text-sage">{deliveries.filter((d) => d.status === 3).length}</div>
            </div>
            <div className="nb-stat-card">
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-1">Avg Rating</div>
              <div className="font-display text-2xl font-bold text-terra">
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
        <div className="space-y-6 stagger-children">
          <PendingWorkers applications={applications} onApproved={handleRefresh} />
          <AddWorkerForm onAdded={handleRefresh} />
          <BulkUpload mode="workers" onComplete={handleRefresh} />
          <ExportData workers={workers} deliveries={deliveries} />
          <WorkerList workers={workers} />
        </div>
      )}

      {/* Deliveries Tab */}
      {activeTab === 'deliveries' && (
        <div className="space-y-6 stagger-children">
          <CreateDelivery workers={workers} onCreated={handleRefresh} />
          <BulkUpload mode="deliveries" workers={workers} onComplete={handleRefresh} />
          <DeliveryTracker deliveries={deliveries} workers={workers} onUpdated={handleRefresh} statusOverrides={statusOverrides} onStatusOverride={handleStatusOverride} />
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <div className="space-y-6 stagger-children">
          <ComplianceDashboard workers={workers} deliveries={deliveries} />
          <ComplianceLog workers={workers} deliveries={deliveries} />
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <Analytics refreshKey={refreshKey} workers={workers} deliveries={deliveries} escrow={escrow} />
      )}
    </DashboardLayout>
  )
}

export default PlatformDashboard
