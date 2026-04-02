import React from 'react'

interface EscrowStatusProps {
  balance: number
  totalDeposited: number
  totalReleased: number
  appAddress?: string
  usdcOptedIn?: boolean
}

const EscrowStatus: React.FC<EscrowStatusProps> = ({ balance, totalDeposited, totalReleased, appAddress, usdcOptedIn }) => {
  const isEmpty = balance === 0 && totalDeposited === 0

  return (
    <div className="bg-surface-raised border border-border rounded-lg p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl text-charcoal">Escrow Pool</h2>
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted">Treasury</span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-2">Balance</div>
          <div className="font-serif text-3xl text-terra">${(balance / 1_000_000).toFixed(2)}</div>
          <div className="text-xs text-muted mt-1">USDC available</div>
        </div>
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-2">Deposited</div>
          <div className="font-serif text-3xl text-charcoal">${(totalDeposited / 1_000_000).toFixed(2)}</div>
          <div className="text-xs text-muted mt-1">Total in</div>
        </div>
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-2">Released</div>
          <div className="font-serif text-3xl text-sage">${(totalReleased / 1_000_000).toFixed(2)}</div>
          <div className="text-xs text-muted mt-1">Total out</div>
        </div>
      </div>

      {appAddress && (
        <div className="mt-6 pt-5 border-t border-border-light">
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-2">Contract Address</div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted break-all leading-relaxed">{appAddress}</span>
            <button
              className="text-[10px] tracking-wider uppercase text-terra hover:text-terra-dark transition-colors flex-shrink-0 border border-terra/30 px-2.5 py-1 rounded"
              onClick={() => navigator.clipboard.writeText(appAddress)}
            >
              Copy
            </button>
          </div>
          {!usdcOptedIn && (
            <div className="flex items-center gap-2 mt-3">
              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
              <span className="text-xs text-yellow-600">Contract has not opted into USDC. Call initialize() first.</span>
            </div>
          )}
        </div>
      )}

      {isEmpty && (
        <div className="mt-6 border border-yellow-200 bg-yellow-50 p-4 rounded">
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 bg-yellow-500 mt-1.5 flex-shrink-0 rounded-full" />
            <div>
              <div className="text-sm font-medium text-yellow-700">No USDC deposited</div>
              <div className="text-xs text-yellow-600 mt-1">
                Send USDC (ASA {import.meta.env.VITE_USDC_ASSET_ID || '10458941'}) to the contract address to fund worker payments.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EscrowStatus
