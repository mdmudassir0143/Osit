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
    <div className="nb-dash-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="nb-section-heading">Escrow Pool</h2>
        <span className="nb-tag bg-cream">Treasury</span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-2">Balance</div>
          <div className="font-display text-3xl font-bold text-terra">${(balance / 1_000_000).toFixed(2)}</div>
          <div className="text-xs text-muted mt-1">USDC available</div>
        </div>
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-2">Deposited</div>
          <div className="font-display text-3xl font-bold text-charcoal">${(totalDeposited / 1_000_000).toFixed(2)}</div>
          <div className="text-xs text-muted mt-1">Total in</div>
        </div>
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-2">Released</div>
          <div className="font-display text-3xl font-bold text-sage">${(totalReleased / 1_000_000).toFixed(2)}</div>
          <div className="text-xs text-muted mt-1">Total out</div>
        </div>
      </div>

      {appAddress && (
        <div className="mt-6 pt-5 border-t-2 border-charcoal/10">
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-2">Contract Address</div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted break-all leading-relaxed">{appAddress}</span>
            <button
              className="nb-btn-ghost !text-[10px] !py-1 !px-2.5"
              onClick={() => navigator.clipboard.writeText(appAddress)}
            >
              Copy
            </button>
          </div>
          {!usdcOptedIn && (
            <div className="flex items-center gap-2 mt-3">
              <div className="w-2 h-2 bg-sun rounded-full" />
              <span className="text-xs text-yellow-600 font-display font-semibold">Contract has not opted into USDC. Call initialize() first.</span>
            </div>
          )}
        </div>
      )}

      {isEmpty && (
        <div className="mt-6 border-2 border-sun bg-sun-light p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-sun mt-1.5 flex-shrink-0 rounded-full" />
            <div>
              <div className="text-sm font-display font-bold text-charcoal">No USDC deposited</div>
              <div className="text-xs text-muted mt-1">
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
