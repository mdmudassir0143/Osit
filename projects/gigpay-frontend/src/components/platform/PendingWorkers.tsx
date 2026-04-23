import React, { useState } from 'react'
import { useWorkerRegistry } from '../../hooks/useWorkerRegistry'
import { useTransactionToast } from '../shared/TransactionToast'
import { ellipseAddress } from '../../utils/ellipseAddress'
import { type ApplicationData } from '../../hooks/usePlatformData'

interface Props {
  applications: ApplicationData[]
  onApproved: () => void
}

const PendingWorkers: React.FC<Props> = ({ applications, onApproved }) => {
  const { approveApplication, rejectApplication } = useWorkerRegistry()
  const { showSuccess, showError } = useTransactionToast()
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleApprove = async (app: ApplicationData) => {
    setProcessingId(app.workerAddress)
    try {
      // Approve with default rating 30 (3.0 stars)
      await approveApplication(app.workerAddress, 30)
      showSuccess(`${app.name} approved and added to registry`)
      onApproved()
    } catch (err: any) {
      showError(err.message || 'Failed to approve worker')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (app: ApplicationData) => {
    setProcessingId(app.workerAddress)
    try {
      await rejectApplication(app.workerAddress)
      showSuccess(`${app.name}'s application rejected`)
      onApproved()
    } catch (err: any) {
      showError(err.message || 'Failed to reject application')
    } finally {
      setProcessingId(null)
    }
  }

  if (applications.length === 0) return null

  return (
    <div className="bg-surface-raised border border-border rounded-lg p-6 md:p-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h2 className="font-serif text-xl text-charcoal">Pending Applications</h2>
          <span className="text-[10px] bg-terra text-white rounded-full px-2 py-0.5 font-medium">
            {applications.length}
          </span>
        </div>
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted">On-Chain</span>
      </div>

      <div className="space-y-3">
        {applications.map((app) => {
          const isProcessing = processingId === app.workerAddress
          const appliedDate = new Date(app.appliedAt * 1000).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })

          return (
            <div
              key={app.workerAddress}
              className="border border-border-light rounded-lg p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-terra-light rounded-full flex items-center justify-center shrink-0">
                <span className="text-terra font-serif text-sm">
                  {app.name.charAt(0).toUpperCase()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-charcoal">{app.name}</span>
                  <span className="text-[10px] font-mono text-muted">{ellipseAddress(app.workerAddress, 4)}</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {app.phone && <span className="text-xs text-muted">{app.phone}</span>}
                  {app.upiId && <span className="text-xs text-muted">{app.upiId}</span>}
                  <span className="text-[10px] text-muted/60">{appliedDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleReject(app)}
                  disabled={isProcessing}
                  className="px-3 py-1.5 text-xs font-medium text-muted border border-border rounded hover:bg-surface hover:text-terra transition-colors disabled:opacity-30"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(app)}
                  disabled={isProcessing}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-terra rounded hover:bg-terra-dark transition-colors disabled:opacity-30 flex items-center gap-1.5"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                      Processing...
                    </>
                  ) : (
                    'Approve'
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PendingWorkers
