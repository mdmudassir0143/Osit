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
    <div className="bg-surface-raised border border-border rounded-lg p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl text-charcoal">Deposit USDC</h2>
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted">Fund Escrow</span>
      </div>

      <form onSubmit={handleDeposit} className="space-y-5">
        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase text-muted block mb-2">
            Amount (USDC)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-full bg-surface border border-border rounded px-4 py-3 text-charcoal text-sm font-mono placeholder-muted/50 focus:border-terra focus:outline-none transition-colors"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100.00"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-terra text-white py-3 text-sm font-medium tracking-wide uppercase hover:bg-terra-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded flex items-center justify-center gap-2"
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
