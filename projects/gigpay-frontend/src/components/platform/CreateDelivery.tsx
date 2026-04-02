import React, { useState } from 'react'
import { useDeliveryManager } from '../../hooks/useDeliveryManager'
import { useTransactionToast } from '../shared/TransactionToast'
import { WorkerData } from '../../hooks/usePlatformData'
import { DUMMY_ORDERS } from '../../data/dummyWorkers'
import { ellipseAddress } from '../../utils/ellipseAddress'

interface CreateDeliveryProps {
  workers: WorkerData[]
  onCreated: () => void
}

const CreateDelivery: React.FC<CreateDeliveryProps> = ({ workers, onCreated }) => {
  const { createDelivery, loading } = useDeliveryManager()
  const { showSuccess, showError } = useTransactionToast()

  const [deliveryId, setDeliveryId] = useState('')
  const [selectedWorker, setSelectedWorker] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [baseAmount, setBaseAmount] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deliveryId || !selectedWorker || !customerName || !baseAmount) return
    try {
      const microAmount = Math.round(Number(baseAmount) * 1_000_000)
      await createDelivery(Number(deliveryId), selectedWorker, microAmount, customerName, pickup, dropoff)
      showSuccess('Delivery created')
      setDeliveryId('')
      setCustomerName('')
      setPickup('')
      setDropoff('')
      setBaseAmount('')
      onCreated()
    } catch (err: any) {
      showError(err.message || 'Failed to create delivery')
    }
  }

  const fillDummy = (d: typeof DUMMY_ORDERS[0]) => {
    setCustomerName(d.customerName)
    setPickup(d.pickup)
    setDropoff(d.dropoff)
    setBaseAmount(String(d.baseAmount))
    // Auto-increment delivery ID
    setDeliveryId(String(Math.floor(Date.now() / 1000) % 100000))
  }

  const activeWorkers = workers.filter((w) => w.status === 1)

  return (
    <div className="bg-surface-raised border border-border rounded-lg p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl text-charcoal">Create Delivery</h2>
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted">Assign Task</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted block mb-1.5">Delivery ID</label>
            <input
              type="number"
              className="w-full bg-surface border border-border rounded px-3 py-2.5 text-charcoal text-sm font-mono placeholder-muted/50 focus:border-terra focus:outline-none transition-colors"
              value={deliveryId}
              onChange={(e) => setDeliveryId(e.target.value)}
              placeholder="1001"
            />
          </div>
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted block mb-1.5">Assign Worker</label>
            <select
              className="w-full bg-surface border border-border rounded px-3 py-2.5 text-charcoal text-sm focus:border-terra focus:outline-none transition-colors"
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
            >
              <option value="">Select worker...</option>
              {activeWorkers.map((w) => (
                <option key={w.address} value={w.address}>
                  {w.name} ({ellipseAddress(w.address, 4)}) — {(w.rating / 10).toFixed(1)}★
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase text-muted block mb-1.5">Customer Name</label>
          <input
            type="text"
            className="w-full bg-surface border border-border rounded px-3 py-2.5 text-charcoal text-sm placeholder-muted/50 focus:border-terra focus:outline-none transition-colors"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Customer name"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted block mb-1.5">Pickup</label>
            <input
              type="text"
              className="w-full bg-surface border border-border rounded px-3 py-2.5 text-charcoal text-sm placeholder-muted/50 focus:border-terra focus:outline-none transition-colors"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              placeholder="Pickup address"
            />
          </div>
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted block mb-1.5">Dropoff</label>
            <input
              type="text"
              className="w-full bg-surface border border-border rounded px-3 py-2.5 text-charcoal text-sm placeholder-muted/50 focus:border-terra focus:outline-none transition-colors"
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
              placeholder="Dropoff address"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase text-muted block mb-1.5">Base Amount (USDC)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-full bg-surface border border-border rounded px-3 py-2.5 text-charcoal text-sm font-mono placeholder-muted/50 focus:border-terra focus:outline-none transition-colors"
            value={baseAmount}
            onChange={(e) => setBaseAmount(e.target.value)}
            placeholder="0.25"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-terra text-white py-2.5 text-sm font-medium tracking-wide uppercase hover:bg-terra-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed rounded flex items-center justify-center gap-2"
            disabled={loading || !deliveryId || !selectedWorker || !customerName || !baseAmount}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                Creating...
              </>
            ) : (
              'Create Delivery'
            )}
          </button>
        </div>

        {DUMMY_ORDERS.length > 0 && (
          <div className="border-t border-border-light pt-4 mt-4">
            <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-2">Quick fill demo data</div>
            <div className="flex flex-wrap gap-2">
              {DUMMY_ORDERS.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => fillDummy(d)}
                  className="text-xs px-3 py-1.5 bg-surface border border-border rounded hover:border-terra/40 hover:text-terra transition-colors"
                >
                  {d.customerName} — ${d.baseAmount}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

export default CreateDelivery
