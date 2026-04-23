import React, { useEffect, useRef, useState } from 'react'
import { useNotifications, type Notification, type NotifType } from '../../hooks/useNotifications'

const TYPE_CONFIG: Record<NotifType, { icon: string; color: string }> = {
  delivery_assigned: { icon: '📦', color: 'bg-sun-light text-charcoal' },
  delivery_picked_up: { icon: '🚴', color: 'bg-sage-light text-charcoal' },
  delivery_completed: { icon: '✅', color: 'bg-sage-light text-charcoal' },
  payment_received: { icon: '💰', color: 'bg-terra-light text-terra' },
  worker_added: { icon: '👤', color: 'bg-lavender/20 text-charcoal' },
  escrow_deposit: { icon: '🏦', color: 'bg-sun-light text-charcoal' },
  escrow_release: { icon: '💸', color: 'bg-terra-light text-terra' },
  rating_changed: { icon: '⭐', color: 'bg-sun-light text-charcoal' },
}

function timeAgo(ts: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - ts
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const NotificationItem: React.FC<{ notif: Notification; onRead: (id: string) => void }> = ({ notif, onRead }) => {
  const config = TYPE_CONFIG[notif.type]
  return (
    <button
      onClick={() => onRead(notif.id)}
      className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-cream ${
        !notif.read ? 'bg-cream/60' : ''
      }`}
    >
      <span className={`flex-shrink-0 w-8 h-8 rounded-lg border-2 border-charcoal/10 flex items-center justify-center text-sm ${config.color}`}>
        {config.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm ${!notif.read ? 'font-bold text-charcoal' : 'font-medium text-muted'}`}>
            {notif.title}
          </span>
          {!notif.read && <span className="w-2 h-2 rounded-full bg-terra flex-shrink-0" />}
        </div>
        <p className="text-xs text-muted mt-0.5 truncate">{notif.description}</p>
        <span className="text-[10px] text-muted/60 mt-1 block font-mono">{timeAgo(notif.timestamp)}</span>
      </div>
    </button>
  )
}

const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, loading, markAllRead, markRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 border-2 border-charcoal rounded-lg text-charcoal hover:bg-charcoal hover:text-white transition-all"
        aria-label="Notifications"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] bg-terra text-white text-[10px] font-bold flex items-center justify-center rounded-full px-1 border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-3 w-[380px] nb-dropdown z-50 overflow-hidden">
          <div className="px-4 py-3 border-b-2 border-charcoal/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-bold text-charcoal">Notifications</span>
              {unreadCount > 0 && (
                <span className="nb-tag bg-terra text-white border-terra text-[9px]">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] font-display font-semibold text-terra hover:text-terra-dark transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto divide-y divide-charcoal/5">
            {loading && notifications.length === 0 ? (
              <div className="py-10 text-center">
                <div className="w-5 h-5 border-2 border-charcoal/20 border-t-terra animate-spin rounded-full mx-auto mb-3" />
                <span className="text-xs text-muted font-display">Loading...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <span className="text-2xl block mb-2">🔔</span>
                <span className="text-sm text-muted font-display font-semibold">No notifications yet</span>
                <p className="text-xs text-muted/60 mt-1">Activity from your contracts will appear here</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <NotificationItem key={notif.id} notif={notif} onRead={markRead} />
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t-2 border-charcoal/10 bg-cream/50">
              <span className="text-[10px] text-muted tracking-wider uppercase font-display font-semibold">
                {notifications.length} event{notifications.length !== 1 ? 's' : ''} tracked
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
