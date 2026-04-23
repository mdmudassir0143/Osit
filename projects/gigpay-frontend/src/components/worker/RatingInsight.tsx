import React from 'react'

interface Props {
  rating: number // 10-50 (1.0★ to 5.0★)
  tasksCompleted: number
  avgBaseAmount?: number // microUSDC average base per delivery
}

// Contract formula: multiplier = 40 + (rating × 22) / 10
// Rating is stored as 10-50 (representing 1.0-5.0)
function getMultiplier(rating: number): number {
  return (40 + (rating * 22) / 10) / 100
}

const TIERS = [
  { min: 10, max: 19, label: '1.0 - 1.9★', name: 'Starter' },
  { min: 20, max: 29, label: '2.0 - 2.9★', name: 'Active' },
  { min: 30, max: 39, label: '3.0 - 3.9★', name: 'Reliable' },
  { min: 40, max: 44, label: '4.0 - 4.4★', name: 'Trusted' },
  { min: 45, max: 50, label: '4.5 - 5.0★', name: 'Elite' },
]

const RatingInsight: React.FC<Props> = ({ rating, tasksCompleted, avgBaseAmount }) => {
  const stars = (rating / 10).toFixed(1)
  const multiplier = getMultiplier(rating)
  const currentTier = TIERS.find((t) => rating >= t.min && rating <= t.max) || TIERS[0]
  const currentTierIdx = TIERS.indexOf(currentTier)
  const nextTier = currentTierIdx < TIERS.length - 1 ? TIERS[currentTierIdx + 1] : null

  const nextMultiplier = nextTier ? getMultiplier(nextTier.min) : multiplier
  const multiplierGain = nextMultiplier - multiplier

  // Estimate extra earnings per delivery at next tier
  const avgBase = avgBaseAmount || 500_000 // default $0.50 if unknown
  const extraPerDelivery = (avgBase * multiplierGain) / 1_000_000

  // Progress within current tier
  const tierRange = currentTier.max - currentTier.min
  const tierProgress = tierRange > 0 ? ((rating - currentTier.min) / tierRange) * 100 : 100

  return (
    <div className="bg-surface-raised border border-border rounded-lg p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl text-charcoal">Rating Insight</h2>
        <div className="flex items-center gap-1.5">
          <span className="font-serif text-2xl text-charcoal">{stars}</span>
          <span className="text-terra text-lg">★</span>
        </div>
      </div>

      {/* Current Tier Card */}
      <div className="bg-surface rounded-lg border border-border-light p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted">Current Tier</span>
            <div className="text-sm font-semibold text-charcoal mt-0.5">{currentTier.name}</div>
          </div>
          <div className="text-right">
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted">Pay Multiplier</span>
            <div className="text-lg font-mono font-semibold text-terra mt-0.5">{(multiplier * 100).toFixed(0)}%</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative">
          <div className="h-2 bg-border-light rounded-full overflow-hidden">
            <div
              className="h-full bg-terra rounded-full transition-all"
              style={{ width: `${Math.min(tierProgress, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted">{(currentTier.min / 10).toFixed(1)}★</span>
            <span className="text-[10px] text-muted">{(currentTier.max / 10).toFixed(1)}★</span>
          </div>
        </div>
      </div>

      {/* Next Tier Preview */}
      {nextTier ? (
        <div className="bg-sage-light/50 rounded-lg border border-sage/20 p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sage text-sm">↑</span>
            <span className="text-sm font-medium text-charcoal">Next: {nextTier.name}</span>
            <span className="text-xs font-mono text-sage ml-auto">{(nextMultiplier * 100).toFixed(0)}%</span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Reach {(nextTier.min / 10).toFixed(1)}★ to unlock{' '}
            <span className="font-medium text-sage">{(nextMultiplier * 100).toFixed(0)}% multiplier</span>.
            {extraPerDelivery > 0 && (
              <> You'd earn ~<span className="font-mono font-medium text-sage">${extraPerDelivery.toFixed(3)}</span> more per delivery.</>
            )}
          </p>
        </div>
      ) : (
        <div className="bg-sun-light/50 rounded-lg border border-sun/30 p-4 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-sun text-sm">⭐</span>
            <span className="text-sm font-medium text-charcoal">Max Tier Reached!</span>
          </div>
          <p className="text-xs text-muted mt-1">You're earning the highest possible multiplier.</p>
        </div>
      )}

      {/* Formula Explanation */}
      <div className="border-t border-border pt-4">
        <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-3">How Pay Works</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Base delivery amount</span>
            <span className="font-mono text-charcoal">$X.XX</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">× Your multiplier ({stars}★)</span>
            <span className="font-mono text-terra">×{multiplier.toFixed(2)}</span>
          </div>
          <div className="h-px bg-border-light" />
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-charcoal">Final payout</span>
            <span className="font-mono text-charcoal">= base × {multiplier.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Tier Table */}
      <div className="mt-5 pt-4 border-t border-border">
        <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-3">All Tiers</div>
        <div className="space-y-1.5">
          {TIERS.map((tier) => {
            const isActive = tier === currentTier
            const mult = getMultiplier(tier.min)
            const multMax = getMultiplier(tier.max)
            return (
              <div
                key={tier.name}
                className={`flex items-center justify-between py-1.5 px-2.5 rounded text-xs ${
                  isActive ? 'bg-terra/5 border border-terra/20' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-terra" />}
                  <span className={isActive ? 'font-medium text-charcoal' : 'text-muted'}>{tier.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted">{tier.label}</span>
                  <span className={`font-mono ${isActive ? 'text-terra font-medium' : 'text-muted'}`}>
                    {(mult * 100).toFixed(0)}–{(multMax * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default RatingInsight
