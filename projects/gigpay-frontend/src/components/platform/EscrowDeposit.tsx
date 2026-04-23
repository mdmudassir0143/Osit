import React, { useState } from 'react'
import { useEscrowPool } from '../../hooks/useEscrowPool'
import { useTransactionToast } from '../shared/TransactionToast'

interface EscrowDepositProps {
  usdcAssetId: number
  onDeposited: () => void
}

const EscrowDeposit: React.FC<EscrowDepositProps> = ({ usdcAssetId, onDeposited }) => {
  const { depositFunds, loading } = useEscrowPool()
  const { showSuccess, showError } = useTransactionToast()
  const [amount, setAmount] = useState('')

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount) return
    const microAmount = Math.round(Number(amount) * 1_000_000)

    try {
      await depositFunds(usdcAssetId, microAmount)
      showSuccess('Deposit successful')
      setAmount('')
      onDeposited()
    } catch (err: any) {
      showError(err.message || 'Deposit failed')
    }
  }

  return (
    <div className="nb-dash-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="nb-section-heading">Deposit USDC</h2>
        <span className="nb-tag bg-cream">Fund Escrow</span>
      </div>

      <form onSubmit={handleDeposit} className="space-y-5">
        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold block mb-2">
            Amount (USDC)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="nb-input nb-input-mono"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100.00"
          />
        </div>

        <button
          type="submit"
          className="nb-btn-primary"
          disabled={loading || !amount}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
              Depositing...
            </>
          ) : (
            'Deposit to Escrow'
          )}
        </button>
      </form>
    </div>
  )
}

export default EscrowDeposit
