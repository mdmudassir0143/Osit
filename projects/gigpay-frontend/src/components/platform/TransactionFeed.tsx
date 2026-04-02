import React, { useEffect, useState } from 'react'
import algosdk from 'algosdk'

const ESCROW_APP_ID = Number(import.meta.env.VITE_ESCROW_APP_ID) || 0
const INDEXER_SERVER = import.meta.env.VITE_INDEXER_SERVER || ''
const INDEXER_PORT = import.meta.env.VITE_INDEXER_PORT || ''
const INDEXER_TOKEN = import.meta.env.VITE_INDEXER_TOKEN || ''

interface TxnInfo {
  id: string
  type: string
  sender: string
  receiver: string
  amount: number
  roundTime: number
  note?: string
}

interface TransactionFeedProps {
  refreshKey: number
}

const TransactionFeed: React.FC<TransactionFeedProps> = ({ refreshKey }) => {
  const [txns, setTxns] = useState<TxnInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ESCROW_APP_ID) { setLoading(false); return }

    const indexer = new algosdk.Indexer(INDEXER_TOKEN, INDEXER_SERVER, INDEXER_PORT)
    const appAddr = algosdk.getApplicationAddress(ESCROW_APP_ID)

    let cancelled = false
    setLoading(true)

    indexer
      .lookupAccountTransactions(appAddr)
      .limit(15)
      .do()
      .then((res: any) => {
        if (cancelled) return
        const transactions = res.transactions || []
        const list: TxnInfo[] = transactions.map((t: any) => {
          let receiver = ''
          let amount = 0
          const type = t['tx-type'] || t.txType || 'unknown'

          if (type === 'pay') {
            receiver = t['payment-transaction']?.receiver || t.paymentTransaction?.receiver || ''
            amount = Number(t['payment-transaction']?.amount || t.paymentTransaction?.amount || 0)
          } else if (type === 'axfer') {
            const axfer = t['asset-transfer-transaction'] || t.assetTransferTransaction || {}
            receiver = axfer.receiver || ''
            amount = Number(axfer.amount || 0)
          }

          let note = ''
          try {
            const noteBytes = t.note ? (typeof t.note === 'string' ? Uint8Array.from(atob(t.note), c => c.charCodeAt(0)) : t.note) : null
            if (noteBytes) note = new TextDecoder().decode(noteBytes).slice(0, 80)
          } catch { /* ignore */ }

          return {
            id: t.id || '',
            type,
            sender: t.sender || '',
            receiver,
            amount,
            roundTime: t['round-time'] || t.roundTime || 0,
            note,
          }
        })
        setTxns(list)
        setLoading(false)
      })
      .catch((e: any) => {
        console.error('TransactionFeed error:', e)
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [refreshKey])

  const short = (addr: string) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '-'

  return (
    <div className="bg-surface-raised border border-border rounded-lg p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl text-charcoal">Recent Transactions</h2>
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted">Live Feed</span>
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block w-5 h-5 border-2 border-border border-t-terra animate-spin rounded-full" />
        </div>
      ) : txns.length === 0 ? (
        <div className="py-10 text-center">
          <div className="text-muted text-sm">No transactions yet</div>
        </div>
      ) : (
        <div className="space-y-1 max-h-[420px] overflow-y-auto">
          {txns.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center gap-4 py-3.5 px-3 -mx-3 border-b border-border-light hover:bg-surface transition-colors group rounded"
            >
              <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 rounded border ${
                tx.type === 'axfer' ? 'border-terra/20 text-terra bg-terra-light' : 'border-border text-muted bg-surface'
              }`}>
                <span className="text-xs font-mono font-medium">
                  {tx.type === 'axfer' ? '$' : tx.type === 'pay' ? 'A' : '?'}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-muted">{short(tx.sender)}</span>
                  <svg className="w-3 h-3 text-muted/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="square" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  <span className="font-mono text-muted">{short(tx.receiver)}</span>
                </div>
                {tx.note && (
                  <div className="text-[11px] text-muted/50 truncate mt-1 font-mono">{tx.note}</div>
                )}
              </div>

              <div className="text-right flex-shrink-0">
                <div className={`text-sm font-mono ${tx.type === 'axfer' ? 'text-terra' : 'text-charcoal'}`}>
                  {tx.type === 'axfer'
                    ? `$${(tx.amount / 1_000_000).toFixed(2)}`
                    : `${(tx.amount / 1_000_000).toFixed(4)} A`}
                </div>
                <div className="text-[10px] text-muted mt-0.5">
                  {tx.roundTime ? new Date(tx.roundTime * 1000).toLocaleString() : '-'}
                </div>
              </div>

              <a
                href={`https://testnet.explorer.perawallet.app/tx/${tx.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] tracking-wider uppercase text-muted hover:text-terra transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
              >
                View
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TransactionFeed
