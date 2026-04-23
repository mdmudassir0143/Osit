import React from 'react'

interface Props {
  rating: number
  tasksCompleted: number
  avgBaseAmount?: number
}

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

  const avgBase = avgBaseAmount || 500_000
  const extraPerDelivery = (avgBase * multiplierGain) / 1_000_000

  const tierRange = currentTier.max - currentTier.min
  const tierProgress = tierRange > 0 ? ((rating - currentTier.min) / tierRange) * 100 : 100

  return (
    <div className="nb-dash-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="nb-section-heading">Rating Insight</h2>
        <div className="flex items-center gap-1.5">
          <span className="font-display text-2xl font-bold text-charcoal">{stars}</span>
          <span className="text-terra text-lg">★</span>
        </div>
      </div>

      {/* Current Tier Card */}
      <div className="bg-cream rounded-lg border-2 border-charcoal/10 p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold">Current Tier</span>
            <div className="text-sm font-display font-bold text-charcoal mt-0.5">{currentTier.name}</div>
          </div>
          <div className="text-right">
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold">Pay Multiplier</span>
            <div className="text-lg font-mono font-bold text-terra mt-0.5">{(multiplier * 100).toFixed(0)}%</div>
          </div>
        </div>

        <div className="relative">
          <div className="h-3 bg-white rounded-full overflow-hidden border-2 border-charcoal/10">
            <div
              className="h-full bg-terra rounded-full transition-all"
              style={{ width: `${Math.min(tierProgress, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted font-mono">{(currentTier.min / 10).toFixed(1)}★</span>
            <span className="text-[10px] text-muted font-mono">{(currentTier.max / 10).toFixed(1)}★</span>
          </div>
        </div>
      </div>

      {/* Next Tier Preview */}
      {nextTier ? (
        <div className="bg-sage-light/50 rounded-lg border-2 border-sage/30 p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sage text-sm font-bold">↑</span>
            <span className="text-sm font-display font-bold text-charcoal">Next: {nextTier.name}</span>
            <span className="text-xs font-mono font-bold text-sage ml-auto">{(nextMultiplier * 100).toFixed(0)}%</span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Reach {(nextTier.min / 10).toFixed(1)}★ to unlock{' '}
            <span className="font-display font-bold text-sage">{(nextMultiplier * 100).toFixed(0)}% multiplier</span>.
            {extraPerDelivery > 0 && (
              <> You'd earn ~<span className="font-mono font-bold text-sage">${extraPerDelivery.toFixed(3)}</span> more per delivery.</>
            )}
          </p>
        </div>
      ) : (
        <div className="bg-sun-light/50 rounded-lg border-2 border-sun/30 p-4 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-sun text-sm">⭐</span>
            <span className="text-sm font-display font-bold text-charcoal">Max Tier Reached!</span>
          </div>
          <p className="text-xs text-muted mt-1">You're earning the highest possible multiplier.</p>
        </div>
      )}

      {/* Formula */}
      <div className="border-t-2 border-charcoal/10 pt-4">
        <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-3">How Pay Works</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Base delivery amount</span>
            <span className="font-mono text-charcoal">$X.XX</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">× Your multiplier ({stars}★)</span>
            <span className="font-mono text-terra font-bold">×{multiplier.toFixed(2)}</span>
          </div>
          <div className="h-[2px] bg-charcoal/10" />
          <div className="flex items-center justify-between text-xs font-display font-bold">
            <span className="text-charcoal">Final payout</span>
            <span className="font-mono text-charcoal">= base × {multiplier.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Tier Table */}
      <div className="mt-5 pt-4 border-t-2 border-charcoal/10">
        <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-3">All Tiers</div>
        <div className="space-y-1.5">
          {TIERS.map((tier) => {
            const isActive = tier === currentTier
            const mult = getMultiplier(tier.min)
            const multMax = getMultiplier(tier.max)
            return (
              <div
                key={tier.name}
                className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs ${
                  isActive ? 'bg-terra/5 border-2 border-terra/20' : 'border-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isActive && <span className="w-2 h-2 rounded-full bg-terra" />}
                  <span className={`font-display font-semibold ${isActive ? 'text-charcoal' : 'text-muted'}`}>{tier.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted font-mono">{tier.label}</span>
                  <span className={`font-mono ${isActive ? 'text-terra font-bold' : 'text-muted'}`}>
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
