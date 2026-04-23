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
      <nav className="bg-white border-b-[2.5px] border-charcoal px-6 md:px-10 py-3.5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-5">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <AloraLogo size="md" />
          </Link>

          <div className="h-6 w-[2px] bg-charcoal/20" />

          <span className="font-display text-sm font-semibold text-charcoal/60 tracking-wide">{title}</span>

          {isAdmin && (
            <span className="nb-tag bg-terra text-white border-charcoal">
              Admin
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />
          {isAdmin ? (
            <Link
              to="/platform"
              className={`font-display text-sm font-semibold px-4 py-2 border-2 border-charcoal rounded-lg transition-all ${
                location.pathname === '/platform'
                  ? 'bg-charcoal text-white shadow-brutal-sm'
                  : 'bg-transparent text-charcoal hover:bg-charcoal hover:text-white'
              }`}
            >
              Platform
            </Link>
          ) : (
            <Link
              to="/worker"
              className={`font-display text-sm font-semibold px-4 py-2 border-2 border-charcoal rounded-lg transition-all ${
                location.pathname === '/worker'
                  ? 'bg-charcoal text-white shadow-brutal-sm'
                  : 'bg-transparent text-charcoal hover:bg-charcoal hover:text-white'
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
