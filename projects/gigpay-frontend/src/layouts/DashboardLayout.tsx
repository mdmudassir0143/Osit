import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useWallet } from '@txnlab/use-wallet-react'
import WalletStatus from '../components/shared/WalletStatus'

const ADMIN_ADDRESS = import.meta.env.VITE_ADMIN_ADDRESS || ''

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  const location = useLocation()
  const { activeAddress } = useWallet()
  const isAdmin = activeAddress === ADMIN_ADDRESS

  return (
    <div className="min-h-screen bg-surface text-charcoal font-sans">
      {/* Header */}
      <nav className="bg-surface-raised border-b border-border px-6 md:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-2.5 h-2.5 bg-terra" />
            <span className="font-serif text-xl tracking-tight text-charcoal">GigPay</span>
          </Link>

          <div className="h-5 w-px bg-border" />

          <span className="text-sm text-muted font-medium">{title}</span>

          {isAdmin && (
            <span className="text-[10px] tracking-[0.2em] uppercase bg-terra-light text-terra px-2.5 py-1 font-medium">
              Admin
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isAdmin ? (
            <Link
              to="/platform"
              className={`text-sm px-4 py-2 transition-all rounded ${
                location.pathname === '/platform'
                  ? 'bg-charcoal/5 text-charcoal font-medium'
                  : 'text-muted hover:text-charcoal'
              }`}
            >
              Platform
            </Link>
          ) : (
            <Link
              to="/worker"
              className={`text-sm px-4 py-2 transition-all rounded ${
                location.pathname === '/worker'
                  ? 'bg-charcoal/5 text-charcoal font-medium'
                  : 'text-muted hover:text-charcoal'
              }`}
            >
              Worker
            </Link>
          )}
          <WalletStatus />
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-8">
        {children}
      </div>
    </div>
  )
}

export default DashboardLayout
