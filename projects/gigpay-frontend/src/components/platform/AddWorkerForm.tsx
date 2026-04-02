import React, { useState } from 'react'
import { useWorkerRegistry } from '../../hooks/useWorkerRegistry'
import { useTransactionToast } from '../shared/TransactionToast'
import { DUMMY_WORKERS, DummyWorker } from '../../data/dummyWorkers'

interface AddWorkerFormProps {
  onAdded: () => void
}

const AddWorkerForm: React.FC<AddWorkerFormProps> = ({ onAdded }) => {
  const { addWorker, loading } = useWorkerRegistry()
  const { showSuccess, showError } = useTransactionToast()

  const [address, setAddress] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [upiId, setUpiId] = useState('')
  const [rating, setRating] = useState('40')
  const [showDummy, setShowDummy] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address || !name) return
    try {
      await addWorker(address, name, phone, upiId, Number(rating))
      showSuccess('Worker added successfully')
      setAddress('')
      setName('')
      setPhone('')
      setUpiId('')
      setRating('40')
      onAdded()
    } catch (err: any) {
      showError(err.message || 'Failed to add worker')
    }
  }

  const fillDummy = (w: DummyWorker) => {
    setName(w.name)
    setPhone(w.phone)
    setUpiId(w.upiId)
    setRating(String(w.rating))
    setShowDummy(false)
  }

  const ratingDisplay = (Number(rating) / 10).toFixed(1)

  return (
    <div className="bg-surface-raised border border-border rounded-lg p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl text-charcoal">Add Worker</h2>
        <button
          type="button"
          onClick={() => setShowDummy(!showDummy)}
          className="text-[10px] tracking-[0.2em] uppercase text-terra hover:text-terra-dark transition-colors"
        >
          {showDummy ? 'Hide' : 'Load Demo Data'}
        </button>
      </div>

      {showDummy && (
        <div className="mb-5 border border-border-light rounded p-3 bg-surface">
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-2">Select a demo worker</div>
          <div className="space-y-1.5">
            {DUMMY_WORKERS.map((w) => (
              <button
                key={w.name}
                type="button"
                onClick={() => fillDummy(w)}
                className="w-full text-left px-3 py-2 rounded hover:bg-surface-raised transition-colors flex items-center justify-between group"
              >
                <div>
                  <span className="text-sm text-charcoal">{w.name}</span>
                  <span className="text-xs text-muted ml-2">{w.upiId}</span>
                </div>
                <span className="text-xs text-muted group-hover:text-terra transition-colors">
                  {(w.rating / 10).toFixed(1)} ★
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase text-muted block mb-1.5">
            Wallet Address
          </label>
          <input
            type="text"
            className="w-full bg-surface border border-border rounded px-3 py-2.5 text-charcoal text-sm font-mono placeholder-muted/50 focus:border-terra focus:outline-none transition-colors"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="ALGO..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted block mb-1.5">Name</label>
            <input
              type="text"
              className="w-full bg-surface border border-border rounded px-3 py-2.5 text-charcoal text-sm placeholder-muted/50 focus:border-terra focus:outline-none transition-colors"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted block mb-1.5">Phone</label>
            <input
              type="text"
              className="w-full bg-surface border border-border rounded px-3 py-2.5 text-charcoal text-sm placeholder-muted/50 focus:border-terra focus:outline-none transition-colors"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91-..."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted block mb-1.5">UPI / Bank ID</label>
            <input
              type="text"
              className="w-full bg-surface border border-border rounded px-3 py-2.5 text-charcoal text-sm placeholder-muted/50 focus:border-terra focus:outline-none transition-colors"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="name@paytm"
            />
          </div>
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted block mb-1.5">
              Rating ({ratingDisplay} ★)
            </label>
            <input
              type="range"
              min="10"
              max="50"
              step="1"
              className="w-full accent-terra mt-2"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
            />
            <div className="flex justify-between text-[10px] text-muted mt-1">
              <span>1.0</span>
              <span>5.0</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-terra text-white py-2.5 text-sm font-medium tracking-wide uppercase hover:bg-terra-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded flex items-center justify-center gap-2"
          disabled={loading || !address || !name}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
              Adding...
            </>
          ) : (
            'Add Worker to Registry'
          )}
        </button>
      </form>
    </div>
  )
}

export default AddWorkerForm
