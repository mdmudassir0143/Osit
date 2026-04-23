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
    <div className="nb-dash-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="nb-section-heading">Add Worker</h2>
        <button
          type="button"
          onClick={() => setShowDummy(!showDummy)}
          className="nb-btn-ghost !text-[10px]"
        >
          {showDummy ? 'Hide' : 'Demo Data'}
        </button>
      </div>

      {showDummy && (
        <div className="mb-5 border-2 border-charcoal/10 rounded-lg p-3 bg-cream">
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-2">Select a demo worker</div>
          <div className="space-y-1.5">
            {DUMMY_WORKERS.map((w) => (
              <button
                key={w.name}
                type="button"
                onClick={() => fillDummy(w)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white transition-colors flex items-center justify-between group border border-transparent hover:border-charcoal/20"
              >
                <div>
                  <span className="text-sm text-charcoal font-display font-semibold">{w.name}</span>
                  <span className="text-xs text-muted ml-2 font-mono">{w.upiId}</span>
                </div>
                <span className="text-xs text-muted group-hover:text-terra transition-colors font-mono">
                  {(w.rating / 10).toFixed(1)} ★
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold block mb-1.5">
            Wallet Address
          </label>
          <input
            type="text"
            className="nb-input nb-input-mono"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="ALGO..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold block mb-1.5">Name</label>
            <input
              type="text"
              className="nb-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold block mb-1.5">Phone</label>
            <input
              type="text"
              className="nb-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91-..."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold block mb-1.5">UPI / Bank ID</label>
            <input
              type="text"
              className="nb-input"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="name@paytm"
            />
          </div>
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold block mb-1.5">
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
            <div className="flex justify-between text-[10px] text-muted font-mono mt-1">
              <span>1.0</span>
              <span>5.0</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="nb-btn-primary"
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
