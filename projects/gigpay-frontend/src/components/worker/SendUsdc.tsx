import React, { useState } from 'react'
import algosdk from 'algosdk'
import { useSendUsdc } from '../../hooks/useSendUsdc'

interface Props {
  usdcBalance: number
  onSent: () => void
}

const SendUsdc: React.FC<Props> = ({ usdcBalance, onSent }) => {
  const { send, sending, error, txId, reset } = useSendUsdc()
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const balance = usdcBalance / 1_000_000
  const parsedAmount = parseFloat(amount) || 0
  const microAmount = Math.round(parsedAmount * 1_000_000)
  const isValidAddress = recipient.length === 58 && algosdk.isValidAddress(recipient)
  const canSend = isValidAddress && parsedAmount > 0 && microAmount <= usdcBalance

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSend) return
    setShowConfirm(true)
  }

  const handleConfirm = async () => {
    setShowConfirm(false)
    const success = await send(recipient, microAmount)
    if (success) {
      setRecipient('')
      setAmount('')
      onSent()
    }
  }

  if (txId) {
    return (
      <div className="nb-dash-card p-6 md:p-8">
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-sage-light rounded-lg border-2 border-sage flex items-center justify-center mx-auto mb-4">
            <span className="text-sage text-xl font-bold">✓</span>
          </div>
          <h3 className="font-display text-xl font-bold text-charcoal mb-2">Sent Successfully</h3>
          <p className="text-sm text-muted mb-4">
            ${parsedAmount.toFixed(2)} USDC sent to {recipient.slice(0, 6)}...{recipient.slice(-4)}
          </p>
          <div className="bg-cream border-2 border-charcoal/10 rounded-lg px-3 py-2 mb-4">
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold block mb-1">Transaction ID</span>
            <span className="text-xs font-mono text-charcoal break-all">{txId}</span>
          </div>
          <button
            onClick={reset}
            className="text-sm text-terra hover:text-terra-dark font-display font-bold transition-colors"
          >
            Send another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="nb-dash-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="nb-section-heading">Send USDC</h2>
        <span className="text-xs font-mono font-bold text-muted">${balance.toFixed(2)} available</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold block mb-2">
            Recipient Address
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => { setRecipient(e.target.value); reset() }}
            placeholder="ALGO..."
            className="nb-input nb-input-mono"
          />
          {recipient.length > 0 && !isValidAddress && (
            <span className="text-[10px] text-terra font-display font-semibold mt-1 block">Invalid Algorand address</span>
          )}
        </div>

        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold block mb-2">
            Amount (USDC)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted font-bold">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); reset() }}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="nb-input nb-input-mono !pl-7 !pr-16"
            />
            <button
              type="button"
              onClick={() => setAmount((usdcBalance / 1_000_000).toString())}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-terra hover:text-terra-dark font-display font-bold uppercase tracking-wider transition-colors"
            >
              Max
            </button>
          </div>
          {parsedAmount > balance && (
            <span className="text-[10px] text-terra font-display font-semibold mt-1 block">Exceeds available balance</span>
          )}
        </div>

        {error && (
          <div className="bg-terra/5 border-2 border-terra/20 rounded-lg px-3 py-2.5">
            <span className="text-xs text-terra font-display font-semibold">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSend || sending}
          className="nb-btn-primary"
        >
          {sending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
              Sending...
            </>
          ) : (
            'Review & Send'
          )}
        </button>
      </form>

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-6">
          <div className="nb-card bg-white p-6 max-w-sm w-full shadow-brutal-lg">
            <h3 className="font-display text-lg font-bold text-charcoal mb-4">Confirm Transfer</h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Amount</span>
                <span className="font-mono font-bold text-charcoal">${parsedAmount.toFixed(2)} USDC</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">To</span>
                <span className="font-mono text-xs text-charcoal">{recipient.slice(0, 8)}...{recipient.slice(-6)}</span>
              </div>
              <div className="h-[2px] bg-charcoal/10" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Remaining</span>
                <span className="font-mono text-charcoal">${(balance - parsedAmount).toFixed(2)} USDC</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="nb-btn-ghost flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="nb-btn-ghost flex-1 !bg-terra !text-white !border-terra hover:!bg-terra-dark"
              >
                Confirm Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SendUsdc
