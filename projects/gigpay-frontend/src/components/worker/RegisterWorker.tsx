import React from 'react'

interface RegisterWorkerProps {
  onRegistered: () => void
}

const RegisterWorker: React.FC<RegisterWorkerProps> = ({ onRegistered: _onRegistered }) => {
  return (
    <div className="bg-surface-raised border border-border rounded-lg p-8 text-center">
      <div className="w-10 h-10 bg-terra-light rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-terra text-lg">!</span>
      </div>
      <h2 className="font-serif text-xl text-charcoal mb-2">Not Registered</h2>
      <p className="text-muted text-sm leading-relaxed max-w-sm mx-auto">
        Your wallet is not registered as a worker. Please contact your merchant to be added to the platform.
      </p>
    </div>
  )
}

export default RegisterWorker
