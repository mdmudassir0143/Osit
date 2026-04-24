import React, { useMemo, useState } from 'react'
import { type DeliveryData, type WorkerData } from '../../hooks/usePlatformData'
import {
  generateInvoiceNumber,
  computeGST,
  formatUSDC,
  formatINR,
  formatDate,
  formatDateISO,
  buildInvoiceData,
  getFinancialQuarter,
  getFinancialMonth,
  INR_RATE,
} from '../../utils/invoice'
import { generatePayoutReceipt } from '../../utils/pdf'

interface Props {
  workers: WorkerData[]
  deliveries: DeliveryData[]
}

type Period = 'all' | 'month' | 'quarter' | 'custom'

function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const DownloadIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const ComplianceDashboard: React.FC<Props> = ({ workers, deliveries }) => {
  const [period, setPeriod] = useState<Period>('all')
  const [filterWorker, setFilterWorker] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showAll, setShowAll] = useState(false)

  const workerMap = useMemo(() => {
    const map: Record<string, WorkerData> = {}
    for (const w of workers) map[w.address] = w
    return map
  }, [workers])

  const paidDeliveries = useMemo(() => {
    let filtered = deliveries.filter((d) => d.status === 3)

    if (filterWorker) {
      filtered = filtered.filter((d) => d.worker === filterWorker)
    }

    if (period === 'month') {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000
      filtered = filtered.filter((d) => d.deliveredAt >= monthStart)
    } else if (period === 'quarter') {
      const now = new Date()
      const month = now.getMonth()
      const qStart = month >= 3 ? (month >= 6 ? (month >= 9 ? 9 : 6) : 3) : 0
      const quarterStart = new Date(now.getFullYear(), qStart, 1).getTime() / 1000
      filtered = filtered.filter((d) => d.deliveredAt >= quarterStart)
    } else if (period === 'custom' && dateFrom) {
      const from = new Date(dateFrom).getTime() / 1000
      filtered = filtered.filter((d) => d.deliveredAt >= from)
      if (dateTo) {
        const to = new Date(dateTo).getTime() / 1000 + 86400
        filtered = filtered.filter((d) => d.deliveredAt < to)
      }
    }

    return filtered.sort((a, b) => b.deliveredAt - a.deliveredAt)
  }, [deliveries, filterWorker, period, dateFrom, dateTo])

  // Aggregated GST stats
  const gstSummary = useMemo(() => {
    let totalPayoutUSDC = 0
    let totalPlatformFee = 0
    let totalCGST = 0
    let totalSGST = 0

    for (const d of paidDeliveries) {
      totalPayoutUSDC += d.finalAmount
      const gst = computeGST(d.finalAmount)
      totalPlatformFee += gst.platformFee
      totalCGST += gst.cgst
      totalSGST += gst.sgst
    }

    return {
      totalPayoutUSDC,
      totalPayoutINR: (totalPayoutUSDC / 1_000_000) * INR_RATE,
      totalPlatformFee,
      totalCGST,
      totalSGST,
      totalGST: totalCGST + totalSGST,
      count: paidDeliveries.length,
      uniqueWorkers: new Set(paidDeliveries.map((d) => d.worker)).size,
    }
  }, [paidDeliveries])

  // Monthly breakdown
  const monthlyBreakdown = useMemo(() => {
    const map: Record<string, { payouts: number; gst: number; count: number; workers: Set<string> }> = {}

    for (const d of paidDeliveries) {
      const date = new Date(d.deliveredAt * 1000)
      const key = getFinancialMonth(date)
      if (!map[key]) map[key] = { payouts: 0, gst: 0, count: 0, workers: new Set() }
      map[key].payouts += d.finalAmount
      map[key].gst += computeGST(d.finalAmount).totalGST
      map[key].count++
      map[key].workers.add(d.worker)
    }

    return Object.entries(map).map(([month, data]) => ({
      month,
      payoutsUSDC: data.payouts / 1_000_000,
      payoutsINR: (data.payouts / 1_000_000) * INR_RATE,
      gstINR: data.gst * INR_RATE,
      count: data.count,
      workers: data.workers.size,
    }))
  }, [paidDeliveries])

  const displayed = showAll ? paidDeliveries : paidDeliveries.slice(0, 15)

  const handleDownloadReceipt = (d: DeliveryData) => {
    const worker = workerMap[d.worker]
    if (!worker) return
    const invoice = buildInvoiceData(d, { ...worker, address: d.worker })
    generatePayoutReceipt(invoice)
  }

  const handleDownloadAllReceipts = () => {
    for (const d of paidDeliveries) {
      handleDownloadReceipt(d)
    }
  }

  const handleExportPayoutLog = () => {
    const header = 'invoice_number,date,worker_name,worker_address,customer,pickup,dropoff,base_usdc,final_usdc,final_inr,platform_fee_inr,cgst_inr,sgst_inr,total_gst_inr'
    const rows = paidDeliveries.map((d) => {
      const worker = workerMap[d.worker]
      const gst = computeGST(d.finalAmount)
      return [
        generateInvoiceNumber(d.id),
        formatDateISO(d.deliveredAt),
        `"${worker?.name || ''}"`,
        d.worker,
        `"${d.customerName}"`,
        `"${d.pickup}"`,
        `"${d.dropoff}"`,
        formatUSDC(d.baseAmount),
        formatUSDC(d.finalAmount),
        formatINR(d.finalAmount),
        (gst.platformFee * INR_RATE).toFixed(2),
        (gst.cgst * INR_RATE).toFixed(2),
        (gst.sgst * INR_RATE).toFixed(2),
        (gst.totalGST * INR_RATE).toFixed(2),
      ].join(',')
    })
    downloadCSV(`alora_payout_log_${Date.now()}.csv`, [header, ...rows].join('\n'))
  }

  const handleExportGSTSummary = () => {
    const header = 'period,total_payouts_usdc,total_payouts_inr,platform_fee_inr,cgst_inr,sgst_inr,total_gst_inr,delivery_count,worker_count'
    const rows = monthlyBreakdown.map((m) => [
      m.month,
      m.payoutsUSDC.toFixed(2),
      m.payoutsINR.toFixed(2),
      (m.payoutsUSDC * 0.10 * INR_RATE).toFixed(2),
      (m.gstINR / 2).toFixed(2),
      (m.gstINR / 2).toFixed(2),
      m.gstINR.toFixed(2),
      m.count,
      m.workers,
    ].join(','))
    downloadCSV(`alora_gst_summary_${Date.now()}.csv`, [header, ...rows].join('\n'))
  }

  return (
    <div className="space-y-6 stagger-children">
      {/* ─── GST Summary Stats ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="nb-stat-card">
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-1">Total Payouts</div>
          <div className="font-display text-xl font-bold text-charcoal">${(gstSummary.totalPayoutUSDC / 1_000_000).toFixed(2)}</div>
          <div className="text-xs text-muted font-mono mt-0.5">₹{gstSummary.totalPayoutINR.toFixed(2)}</div>
        </div>
        <div className="nb-stat-card">
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-1">Platform Fee</div>
          <div className="font-display text-xl font-bold text-terra">₹{(gstSummary.totalPlatformFee * INR_RATE).toFixed(2)}</div>
          <div className="text-xs text-muted font-mono mt-0.5">10% commission</div>
        </div>
        <div className="nb-stat-card">
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-1">Total GST</div>
          <div className="font-display text-xl font-bold text-sage">₹{(gstSummary.totalGST * INR_RATE).toFixed(2)}</div>
          <div className="text-xs text-muted font-mono mt-0.5">CGST ₹{(gstSummary.totalCGST * INR_RATE).toFixed(2)} + SGST ₹{(gstSummary.totalSGST * INR_RATE).toFixed(2)}</div>
        </div>
        <div className="nb-stat-card">
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold mb-1">Deliveries / Workers</div>
          <div className="font-display text-xl font-bold text-charcoal">{gstSummary.count}</div>
          <div className="text-xs text-muted font-mono mt-0.5">{gstSummary.uniqueWorkers} unique workers</div>
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div className="nb-dash-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="nb-section-heading">Payout Log</h3>
          <div className="flex items-center gap-2">
            <span className="nb-tag bg-cream">GST Compliant</span>
            <span className="nb-tag bg-terra/10 text-terra border-terra/20">{paidDeliveries.length} records</span>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 mb-5">
          {/* Period filter */}
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold block mb-1">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="nb-select text-xs"
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Worker filter */}
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold block mb-1">Worker</label>
            <select
              value={filterWorker}
              onChange={(e) => setFilterWorker(e.target.value)}
              className="nb-select text-xs"
            >
              <option value="">All Workers</option>
              {workers.map((w) => (
                <option key={w.address} value={w.address}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Custom date range */}
          {period === 'custom' && (
            <>
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold block mb-1">From</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="nb-input text-xs" />
              </div>
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-muted font-display font-semibold block mb-1">To</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="nb-input text-xs" />
              </div>
            </>
          )}
        </div>

        {/* Payout log table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-[2.5px] border-charcoal/10">
                <th className="text-left py-2.5 px-2 font-display font-bold text-[10px] tracking-[0.15em] uppercase text-muted">Invoice</th>
                <th className="text-left py-2.5 px-2 font-display font-bold text-[10px] tracking-[0.15em] uppercase text-muted">Date</th>
                <th className="text-left py-2.5 px-2 font-display font-bold text-[10px] tracking-[0.15em] uppercase text-muted">Worker</th>
                <th className="text-right py-2.5 px-2 font-display font-bold text-[10px] tracking-[0.15em] uppercase text-muted">Amount</th>
                <th className="text-right py-2.5 px-2 font-display font-bold text-[10px] tracking-[0.15em] uppercase text-muted">GST</th>
                <th className="text-right py-2.5 px-2 font-display font-bold text-[10px] tracking-[0.15em] uppercase text-muted">INR</th>
                <th className="py-2.5 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((d) => {
                const worker = workerMap[d.worker]
                const gst = computeGST(d.finalAmount)
                return (
                  <tr key={d.id} className="nb-table-row border-b border-charcoal/5">
                    <td className="py-2.5 px-2 font-mono text-charcoal">{generateInvoiceNumber(d.id)}</td>
                    <td className="py-2.5 px-2 text-muted">{formatDate(d.deliveredAt)}</td>
                    <td className="py-2.5 px-2 font-display font-semibold text-charcoal">{worker?.name || d.worker.slice(0, 8) + '...'}</td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-charcoal">${formatUSDC(d.finalAmount)}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-sage">₹{(gst.totalGST * INR_RATE).toFixed(2)}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-terra">₹{formatINR(d.finalAmount)}</td>
                    <td className="py-2.5 px-2">
                      <button
                        onClick={() => handleDownloadReceipt(d)}
                        className="p-1 rounded border-2 border-charcoal/10 hover:border-charcoal hover:bg-charcoal hover:text-white text-muted transition-all"
                        title="Download receipt"
                      >
                        <DownloadIcon />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {paidDeliveries.length > 15 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-3 text-xs text-terra hover:text-terra-dark font-display font-bold transition-colors"
          >
            {showAll ? 'Show less' : `Show all ${paidDeliveries.length} records`}
          </button>
        )}

        {paidDeliveries.length === 0 && (
          <div className="py-10 text-center text-sm text-muted font-display">No paid deliveries in this period</div>
        )}
      </div>

      {/* ─── Monthly / Quarterly Breakdown ─── */}
      {monthlyBreakdown.length > 0 && (
        <div className="nb-dash-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="nb-section-heading">Tax Period Breakdown</h3>
            <span className="nb-tag bg-cream">Indian FY</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b-[2.5px] border-charcoal/10">
                  <th className="text-left py-2.5 px-2 font-display font-bold text-[10px] tracking-[0.15em] uppercase text-muted">Period</th>
                  <th className="text-right py-2.5 px-2 font-display font-bold text-[10px] tracking-[0.15em] uppercase text-muted">Payouts (USDC)</th>
                  <th className="text-right py-2.5 px-2 font-display font-bold text-[10px] tracking-[0.15em] uppercase text-muted">Payouts (INR)</th>
                  <th className="text-right py-2.5 px-2 font-display font-bold text-[10px] tracking-[0.15em] uppercase text-muted">GST (INR)</th>
                  <th className="text-right py-2.5 px-2 font-display font-bold text-[10px] tracking-[0.15em] uppercase text-muted">Deliveries</th>
                  <th className="text-right py-2.5 px-2 font-display font-bold text-[10px] tracking-[0.15em] uppercase text-muted">Workers</th>
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdown.map((m) => (
                  <tr key={m.month} className="nb-table-row border-b border-charcoal/5">
                    <td className="py-2.5 px-2 font-display font-semibold text-charcoal">{m.month}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-charcoal">${m.payoutsUSDC.toFixed(2)}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-terra">₹{m.payoutsINR.toFixed(2)}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-sage">₹{m.gstINR.toFixed(2)}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-charcoal">{m.count}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-charcoal">{m.workers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Export Actions ─── */}
      <div className="nb-dash-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-sm font-bold text-charcoal">Export & Download</h3>
          <span className="nb-tag bg-cream">Compliance</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button onClick={handleExportPayoutLog} disabled={paidDeliveries.length === 0} className="nb-btn-ghost flex items-center justify-center gap-2">
            <DownloadIcon /> Payout Log (CSV)
          </button>
          <button onClick={handleExportGSTSummary} disabled={monthlyBreakdown.length === 0} className="nb-btn-ghost flex items-center justify-center gap-2">
            <DownloadIcon /> GST Summary (CSV)
          </button>
          <button onClick={handleDownloadAllReceipts} disabled={paidDeliveries.length === 0} className="nb-btn-ghost flex items-center justify-center gap-2">
            <DownloadIcon /> All Receipts (PDF)
          </button>
          <div className="flex items-center justify-center text-[10px] text-muted font-display">
            {paidDeliveries.length} records available
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComplianceDashboard
