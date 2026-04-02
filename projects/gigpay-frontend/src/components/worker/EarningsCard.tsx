import React from 'react'

interface EarningsCardProps {
  totalEarned: number
  tasksCompleted: number
  usdcBalance: number
  rating: number
}

const EarningsCard: React.FC<EarningsCardProps> = ({ totalEarned, tasksCompleted, usdcBalance, rating }) => {
  const earned = (totalEarned / 1_000_000).toFixed(2)
  const balance = (usdcBalance / 1_000_000).toFixed(2)
  const stars = (rating / 10).toFixed(1)

  return (
    <div className="bg-surface-raised border border-border rounded-lg p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl text-charcoal">Earnings</h2>
        <div className="flex items-center gap-1">
          <span className="text-sm text-charcoal font-medium">{stars}</span>
          <span className="text-terra">★</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-2">Total Earned</div>
          <div className="font-serif text-3xl text-charcoal">${earned}</div>
          <div className="text-xs text-muted mt-1">USDC lifetime</div>
        </div>
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-2">Wallet Balance</div>
          <div className="font-serif text-3xl text-sage">${balance}</div>
          <div className="text-xs text-muted mt-1">USDC available</div>
        </div>
        <div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-2">Deliveries</div>
          <div className="font-serif text-3xl text-charcoal">{tasksCompleted}</div>
          <div className="text-xs text-muted mt-1">Completed</div>
        </div>
      </div>
    </div>
  )
}

export default EarningsCard
