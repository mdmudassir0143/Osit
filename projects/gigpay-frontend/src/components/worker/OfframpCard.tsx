import React from 'react'

interface OfframpCardProps {
  usdcBalance: number
  upiId: string
}

const INR_RATE = 83.5

const OfframpCard: React.FC<OfframpCardProps> = ({ usdcBalance, upiId }) => {
  const usdcAmount = usdcBalance / 1_000_000
  const inrAmount = (usdcAmount * INR_RATE).toFixed(2)

  return (
    <div className="bg-surface-raised border border-border rounded-lg p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl text-charcoal">Off-Ramp to INR</h2>
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted">Withdraw</span>
      </div>

      <div className="flex items-center justify-between py-4 mb-4">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-1">USDC Balance</div>
          <div className="font-serif text-2xl text-charcoal">${usdcAmount.toFixed(2)}</div>
        </div>
        <div className="text-2xl text-muted/30">=</div>
        <div className="text-right">
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-1">INR Equivalent</div>
          <div className="font-serif text-2xl text-terra">₹{inrAmount}</div>
        </div>
      </div>

      <div className="text-xs text-muted mb-4">Rate: 1 USDC = ₹{INR_RATE}</div>

      <div className="border-t border-border-light pt-4">
        <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-2">Withdraw to UPI</div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-surface border border-border rounded px-3 py-2.5 text-sm font-mono text-charcoal">
            {upiId || 'No UPI linked'}
          </div>
          <button
            className="bg-terra text-white px-5 py-2.5 text-sm font-medium tracking-wide uppercase hover:bg-terra-dark transition-colors rounded disabled:opacity-30"
            disabled={!upiId || usdcBalance === 0}
          >
            Withdraw
          </button>
        </div>
        <p className="text-[10px] text-muted mt-2">
          Off-ramp converts USDC to INR and credits your UPI account. Processing time: 1-2 business days.
        </p>
      </div>
    </div>
  )
}

export default OfframpCard
