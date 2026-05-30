import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
  address: string
  handle: string
}

const ShareCard: React.FC<Props> = ({ address, handle }) => {
  const [copied, setCopied] = useState<'url' | 'addr' | null>(null)
  // Use the current origin so the QR works regardless of whether you're
  // on localhost, Vercel preview, or production.
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://alora.id'
  const publicUrl = `${origin}/w/${address}`
  const issuerScanUrl = `${origin}/issuer?subject=${address}`

  const copy = (val: string, tag: 'url' | 'addr') => {
    navigator.clipboard.writeText(val).then(() => {
      setCopied(tag)
      setTimeout(() => setCopied(null), 1800)
    })
  }

  return (
    <div className="nb-card bg-white rounded-2xl p-6 md:p-8 shadow-brutal-lavender">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <span className="nb-tag bg-lavender/30 text-charcoal border-lavender/50 text-[11px] mb-2">Share</span>
          <h3 className="font-display text-xl font-bold text-charcoal mt-1">Your Aura on a QR code</h3>
          <p className="text-charcoal/50 text-sm mt-1 max-w-lg">
            Show this at the end of a shift. An employer scans it with their phone — by the time you walk out, your record is
            updated. The QR encodes a deep link that opens the issuer form pre-filled with your address.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-start">
        {/* QR */}
        <div className="bg-white p-4 border border-charcoal/15 rounded-xl shadow-brutal-sm w-fit mx-auto md:mx-0">
          <QRCodeSVG value={issuerScanUrl} size={192} bgColor="#fef9ec" fgColor="#22231f" level="M" />
          <div className="mt-3 text-center font-mono text-[12px] tracking-[0.1em] uppercase text-charcoal/45">
            Scan to attest
          </div>
        </div>

        {/* Links */}
        <div className="space-y-3">
          <div>
            <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-charcoal/40 mb-1.5">Your handle</div>
            <div className="font-display text-2xl font-extrabold text-charcoal">@{handle}</div>
          </div>

          <div>
            <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-charcoal/40 mb-1.5">Public profile</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-xs text-charcoal/70 bg-cream px-3 py-2 rounded-md border-[1.5px] border-charcoal/10 truncate">
                {publicUrl}
              </code>
              <button
                onClick={() => copy(publicUrl, 'url')}
                className="nb-btn bg-charcoal text-cream px-3 py-2 text-[12px] font-display font-bold tracking-widest uppercase shrink-0"
              >
                {copied === 'url' ? 'Copied' : 'Copy'}
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="nb-btn bg-cream text-charcoal px-3 py-2 text-[12px] font-display font-bold tracking-widest uppercase shrink-0"
              >
                Open ↗
              </a>
            </div>
          </div>

          <div>
            <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-charcoal/40 mb-1.5">Wallet address</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-xs text-charcoal/70 bg-cream px-3 py-2 rounded-md border-[1.5px] border-charcoal/10 truncate">
                {address}
              </code>
              <button
                onClick={() => copy(address, 'addr')}
                className="nb-btn bg-charcoal text-cream px-3 py-2 text-[12px] font-display font-bold tracking-widest uppercase shrink-0"
              >
                {copied === 'addr' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="pt-3 border-t-[1.5px] border-dashed border-charcoal/10 text-[12px] text-charcoal/45 leading-relaxed">
            Workers in field-service / blue-collar gigs can carry this on their phone home-screen. No app install required — the
            QR opens directly in the issuer's browser.
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShareCard
