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
    setDeliveryId(String(Math.floor(Date.now() / 1000) % 100000))
  }

  const activeWorkers = workers.filter((w) => w.status === 1)

  return (
    <div className="nb-dash-card p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="nb-section-heading">Create Delivery</h2>
        <span className="nb-tag bg-cream">Assign Task</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold block mb-1.5">Delivery ID</label>
            <input
              type="number"
              className="nb-input nb-input-mono"
              value={deliveryId}
              onChange={(e) => setDeliveryId(e.target.value)}
              placeholder="1001"
            />
          </div>
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold block mb-1.5">Assign Worker</label>
            <select
              className="nb-select"
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
          <label className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold block mb-1.5">Customer Name</label>
          <input
            type="text"
            className="nb-input"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Customer name"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold block mb-1.5">Pickup</label>
            <input
              type="text"
              className="nb-input"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              placeholder="Pickup address"
            />
          </div>
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold block mb-1.5">Dropoff</label>
            <input
              type="text"
              className="nb-input"
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
              placeholder="Dropoff address"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold block mb-1.5">Base Amount (USDC)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="nb-input nb-input-mono"
            value={baseAmount}
            onChange={(e) => setBaseAmount(e.target.value)}
            placeholder="0.25"
          />
        </div>

        <button
          type="submit"
          className="nb-btn-primary"
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

        {DUMMY_ORDERS.length > 0 && (
          <div className="border-t-2 border-charcoal/10 pt-4 mt-4">
            <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-2">Quick fill demo data</div>
            <div className="flex flex-wrap gap-2">
              {DUMMY_ORDERS.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => fillDummy(d)}
                  className="nb-btn-ghost !text-[10px] !py-1.5"
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
