import React, { useState } from 'react'
import algosdk from 'algosdk'
import { useWorkerRegistry } from '../../hooks/useWorkerRegistry'

interface Props {
  walletAddress: string
}

const RegisterWorker: React.FC<Props> = ({ walletAddress }) => {
  const { applyWorker, loading } = useWorkerRegistry()
  const [platformAddress, setPlatformAddress] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [upiId, setUpiId] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValidPlatform = platformAddress.length === 58 && algosdk.isValidAddress(platformAddress)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !isValidPlatform) return

    setError(null)

    try {
      await applyWorker(platformAddress.trim(), name.trim(), phone.trim(), upiId.trim())
      setSubmitted(true)
    } catch (err: any) {
      const msg = err?.message || 'Application failed'
      if (msg.includes('already')) {
        setError('You already have a pending application to this platform')
      } else {
        setError(msg.length > 120 ? msg.slice(0, 120) + '...' : msg)
      }
    }
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-surface-raised border border-border rounded-lg p-8 text-center">
          <div className="w-12 h-12 bg-sage-light rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-sage text-xl">✓</span>
          </div>
          <h2 className="font-serif text-xl text-charcoal mb-2">Application Submitted</h2>
          <p className="text-muted text-sm leading-relaxed max-w-sm mx-auto mb-4">
            Your application is stored on-chain. The platform will review and approve your registration.
          </p>
          <div className="space-y-2">
            <div className="bg-surface border border-border-light rounded px-3 py-2">
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-1">Applied As</div>
              <div className="text-sm text-charcoal font-medium">{name}</div>
            </div>
            <div className="bg-surface border border-border-light rounded px-3 py-2">
              <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-1">Platform</div>
              <div className="text-xs font-mono text-muted break-all">{platformAddress}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-surface-raised border border-border rounded-lg p-8">
        <div className="text-center mb-6">
          <div className="w-10 h-10 bg-terra-light rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-terra text-lg">+</span>
          </div>
          <h2 className="font-serif text-xl text-charcoal mb-2">Apply to Join</h2>
          <p className="text-muted text-sm leading-relaxed max-w-sm mx-auto">
            Your wallet isn't registered yet. Submit your details on-chain and the platform will review your application.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted block mb-1.5">Platform / Employer Address</label>
            <input
              type="text"
              value={platformAddress}
              onChange={(e) => setPlatformAddress(e.target.value)}
              placeholder="ALGO... (merchant wallet address)"
              className="w-full bg-surface border border-border rounded px-3 py-2.5 text-sm font-mono text-charcoal placeholder-muted/50 focus:border-terra focus:outline-none transition-colors"
            />
            {platformAddress.length > 0 && !isValidPlatform && (
              <span className="text-[10px] text-terra mt-1 block">Invalid Algorand address</span>
            )}
            <p className="text-[10px] text-muted/60 mt-1">Ask your employer for their platform wallet address</p>
          </div>

          <div className="h-px bg-border-light" />

          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted block mb-1.5">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              maxLength={32}
              className="w-full bg-surface border border-border rounded px-3 py-2.5 text-sm text-charcoal placeholder-muted/50 focus:border-terra focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted block mb-1.5">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91-9876543210"
              maxLength={16}
              className="w-full bg-surface border border-border rounded px-3 py-2.5 text-sm text-charcoal placeholder-muted/50 focus:border-terra focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-muted block mb-1.5">UPI / Bank ID</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="name@paytm"
              maxLength={32}
              className="w-full bg-surface border border-border rounded px-3 py-2.5 text-sm text-charcoal placeholder-muted/50 focus:border-terra focus:outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="bg-terra/5 border border-terra/20 rounded px-3 py-2.5">
              <span className="text-xs text-terra">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || !isValidPlatform}
            className="w-full bg-terra text-white py-3 text-sm font-medium tracking-wide uppercase hover:bg-terra-dark transition-colors rounded disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                Submitting On-Chain...
              </>
            ) : (
              'Submit Application'
            )}
          </button>

          <p className="text-[10px] text-muted/60 text-center">
            This requires a small MBR payment (~0.1 ALGO) to store your application on-chain.
          </p>
        </form>

        <div className="mt-4 pt-4 border-t border-border-light text-center">
          <div className="text-[10px] tracking-[0.2em] uppercase text-muted mb-1">Your Wallet</div>
          <div className="text-xs font-mono text-muted break-all">{walletAddress}</div>
        </div>
      </div>
    </div>
  )
}

export default RegisterWorker
