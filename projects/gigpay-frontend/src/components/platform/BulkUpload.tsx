import React, { useCallback, useRef, useState } from 'react'
import { useWorkerRegistry } from '../../hooks/useWorkerRegistry'
import { useDeliveryManager } from '../../hooks/useDeliveryManager'
import { WorkerData } from '../../hooks/usePlatformData'

type Mode = 'workers' | 'deliveries'

interface Props {
  mode: Mode
  workers?: WorkerData[]
  onComplete: () => void
}

interface RowResult {
  row: number
  data: string
  status: 'pending' | 'success' | 'error'
  error?: string
}

function parseCSV(text: string): string[][] {
  const lines = text.trim().split('\n')
  return lines.map((line) =>
    line.split(',').map((cell) => cell.trim().replace(/^["']|["']$/g, '')),
  )
}

const BulkUpload: React.FC<Props> = ({ mode, workers = [], onComplete }) => {
  const { addWorker } = useWorkerRegistry()
  const { createDelivery } = useDeliveryManager()
  const fileRef = useRef<HTMLInputElement>(null)
  const [results, setResults] = useState<RowResult[]>([])
  const [processing, setProcessing] = useState(false)
  const [currentRow, setCurrentRow] = useState(0)
  const [totalRows, setTotalRows] = useState(0)

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const text = await file.text()
      const rows = parseCSV(text)

      // Skip header row if it looks like headers
      const firstRow = rows[0]
      const hasHeader =
        firstRow &&
        firstRow.some((cell) =>
          ['name', 'address', 'phone', 'worker', 'customer', 'pickup', 'amount', 'rating', 'upi'].includes(
            cell.toLowerCase(),
          ),
        )
      const dataRows = hasHeader ? rows.slice(1) : rows
      const validRows = dataRows.filter((r) => r.length > 1 && r[0])

      setTotalRows(validRows.length)
      setCurrentRow(0)
      setProcessing(true)

      const rowResults: RowResult[] = validRows.map((r, i) => ({
        row: i + 1,
        data: r.join(', '),
        status: 'pending' as const,
      }))
      setResults([...rowResults])

      for (let i = 0; i < validRows.length; i++) {
        setCurrentRow(i + 1)
        const row = validRows[i]

        try {
          if (mode === 'workers') {
            // Expected: address, name, phone, upi_id, rating
            const [address, name, phone = '', upiId = '', ratingStr = '40'] = row
            if (!address || !name) throw new Error('Missing address or name')
            const rating = Math.max(10, Math.min(50, Number(ratingStr) || 40))
            await addWorker(address, name, phone, upiId, rating)
          } else {
            // Expected: worker_address, customer, pickup, dropoff, amount
            const [workerAddr, customer, pickup = '', dropoff = '', amountStr = '0'] = row
            if (!workerAddr || !customer) throw new Error('Missing worker address or customer')
            const baseAmount = Math.round((parseFloat(amountStr) || 0) * 1_000_000)
            const deliveryId = Math.floor(Date.now() / 1000) % 100000 + i
            await createDelivery(deliveryId, workerAddr, baseAmount, customer, pickup, dropoff)
          }
          rowResults[i].status = 'success'
        } catch (err: any) {
          rowResults[i].status = 'error'
          rowResults[i].error = err?.message?.slice(0, 80) || 'Failed'
        }

        setResults([...rowResults])
      }

      setProcessing(false)
      onComplete()

      // Reset file input
      if (fileRef.current) fileRef.current.value = ''
    },
    [mode, addWorker, createDelivery, onComplete],
  )

  const successCount = results.filter((r) => r.status === 'success').length
  const errorCount = results.filter((r) => r.status === 'error').length

  const csvTemplate =
    mode === 'workers'
      ? 'address,name,phone,upi_id,rating\nALGO...,John Doe,+91-9876543210,john@paytm,40'
      : 'worker_address,customer,pickup,dropoff,amount\nALGO...,Customer Name,Pickup Address,Dropoff Address,0.25'

  return (
    <div className="bg-surface-raised border border-border rounded-lg p-6 md:p-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif text-xl text-charcoal">
          Bulk {mode === 'workers' ? 'Add Workers' : 'Create Deliveries'}
        </h2>
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted">CSV Upload</span>
      </div>

      {/* Template Download */}
      <div className="bg-surface border border-border-light rounded p-3 mb-5">
        <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-2">CSV Format</div>
        <code className="text-xs font-mono text-charcoal block whitespace-pre-wrap leading-relaxed">
          {csvTemplate}
        </code>
        <button
          onClick={() => {
            const blob = new Blob([csvTemplate], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${mode}_template.csv`
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="text-[11px] text-terra hover:text-terra-dark font-medium mt-2 transition-colors"
        >
          Download template
        </button>
      </div>

      {/* Upload */}
      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleFile}
          disabled={processing}
          className="hidden"
          id={`bulk-upload-${mode}`}
        />
        <label
          htmlFor={`bulk-upload-${mode}`}
          className={`flex-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            processing
              ? 'border-border bg-surface/50 cursor-not-allowed'
              : 'border-border-light hover:border-terra/40 hover:bg-terra/5'
          }`}
        >
          {processing ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-border border-t-terra animate-spin rounded-full" />
              <span className="text-sm text-muted">
                Processing row {currentRow} of {totalRows}...
              </span>
            </div>
          ) : (
            <>
              <span className="text-sm text-muted block">
                Drop a CSV file or <span className="text-terra font-medium">click to browse</span>
              </span>
              <span className="text-[10px] text-muted/60 mt-1 block">
                {mode === 'workers' ? 'address, name, phone, upi_id, rating' : 'worker_address, customer, pickup, dropoff, amount'}
              </span>
            </>
          )}
        </label>
      </div>

      {/* Progress Bar */}
      {totalRows > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted">
              {processing ? `${currentRow}/${totalRows}` : 'Complete'}
            </span>
            <div className="flex items-center gap-3">
              {successCount > 0 && <span className="text-xs text-sage font-medium">{successCount} OK</span>}
              {errorCount > 0 && <span className="text-xs text-terra font-medium">{errorCount} failed</span>}
            </div>
          </div>
          <div className="h-2 bg-border-light rounded-full overflow-hidden">
            <div
              className="h-full bg-terra rounded-full transition-all duration-300"
              style={{ width: `${(currentRow / totalRows) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && !processing && (
        <div className="mt-4 max-h-48 overflow-y-auto divide-y divide-border-light border border-border-light rounded">
          {results.map((r) => (
            <div
              key={r.row}
              className={`px-3 py-2 flex items-center justify-between text-xs ${
                r.status === 'error' ? 'bg-terra/5' : ''
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={r.status === 'success' ? 'text-sage' : 'text-terra'}>
                  {r.status === 'success' ? '✓' : '✗'}
                </span>
                <span className="text-muted truncate">Row {r.row}: {r.data}</span>
              </div>
              {r.error && <span className="text-terra shrink-0 ml-2">{r.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default BulkUpload
