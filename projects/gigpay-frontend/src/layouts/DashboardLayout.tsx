import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useWallet } from '@txnlab/use-wallet-react'
import WalletStatus from '../components/shared/WalletStatus'
import NotificationBell from '../components/shared/NotificationBell'
import AloraLogo from '../components/shared/AloraLogo'

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
    <div className="min-h-screen bg-cream text-charcoal font-sans">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Header */}
      <nav className="sticky top-0 z-40 bg-cream/85 backdrop-blur-md border-b border-charcoal/10 px-6 md:px-10 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <AloraLogo size="md" />
          </Link>

          <div className="h-5 w-px bg-charcoal/15" />

          <span className="font-display text-sm font-semibold text-charcoal/60 tracking-wide">{title}</span>

          {isAdmin && <span className="nb-tag bg-terra text-cream border-transparent">Admin</span>}
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />
          {isAdmin ? (
            <Link
              to="/platform"
              className={`font-display text-sm font-semibold px-4 py-2 rounded-full transition-all ${
                location.pathname === '/platform'
                  ? 'bg-charcoal text-cream'
                  : 'border border-charcoal/18 text-charcoal hover:bg-charcoal hover:text-cream hover:border-charcoal'
              }`}
            >
              Platform
            </Link>
          ) : (
            <Link
              to="/worker"
              className={`font-display text-sm font-semibold px-4 py-2 rounded-full transition-all ${
                location.pathname === '/worker'
                  ? 'bg-charcoal text-cream'
                  : 'border border-charcoal/18 text-charcoal hover:bg-charcoal hover:text-cream hover:border-charcoal'
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
