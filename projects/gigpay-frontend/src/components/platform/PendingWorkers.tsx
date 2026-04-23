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
    <div className="nb-dash-card p-6 md:p-8 border-terra">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h2 className="nb-section-heading">Pending Applications</h2>
          <span className="nb-tag bg-terra text-white border-terra">
            {applications.length}
          </span>
        </div>
        <span className="nb-tag bg-sage-light text-sage border-sage">On-Chain</span>
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
              className="border-2 border-charcoal/10 rounded-lg p-4 flex items-center gap-4 hover:border-charcoal/30 transition-colors"
            >
              <div className="w-10 h-10 bg-terra-light rounded-lg border-2 border-charcoal/10 flex items-center justify-center shrink-0">
                <span className="text-terra font-display font-bold text-sm">
                  {app.name.charAt(0).toUpperCase()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-display font-bold text-charcoal">{app.name}</span>
                  <span className="text-[10px] font-mono text-muted">{ellipseAddress(app.workerAddress, 4)}</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {app.phone && <span className="text-xs text-muted">{app.phone}</span>}
                  {app.upiId && <span className="text-xs text-muted font-mono">{app.upiId}</span>}
                  <span className="text-[10px] text-muted/60 font-mono">{appliedDate}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleReject(app)}
                  disabled={isProcessing}
                  className="nb-btn-ghost !text-[10px]"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleApprove(app)}
                  disabled={isProcessing}
                  className="nb-btn-ghost !bg-terra !text-white !border-terra hover:!bg-terra-dark !text-[10px] flex items-center gap-1.5"
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
