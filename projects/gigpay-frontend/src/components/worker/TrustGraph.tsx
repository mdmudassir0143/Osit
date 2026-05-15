import React, { useMemo } from 'react'
import { AttestationRecord, CATEGORY_LABELS } from '../../services/attestations'

interface Props {
  subject: string
  attestations: AttestationRecord[]
}

const truncate = (s: string, head = 4, tail = 4) =>
  s.length > head + tail + 3 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s

interface IssuerNode {
  address: string
  count: number
  topCategory: number
}

// Aggregate attestations per issuer and compute their position on a ring
// around the central subject node.
const buildIssuers = (attestations: AttestationRecord[]): IssuerNode[] => {
  const map = new Map<string, { count: number; cats: Map<number, number> }>()
  for (const a of attestations) {
    if (a.revoked) continue
    if (!map.has(a.issuer)) map.set(a.issuer, { count: 0, cats: new Map() })
    const entry = map.get(a.issuer)!
    entry.count += 1
    entry.cats.set(a.category, (entry.cats.get(a.category) ?? 0) + 1)
  }
  const out: IssuerNode[] = []
  for (const [address, { count, cats }] of map.entries()) {
    const topCategory = Array.from(cats.entries()).sort((x, y) => y[1] - x[1])[0][0]
    out.push({ address, count, topCategory })
  }
  out.sort((a, b) => b.count - a.count)
  return out
}

const palette: Record<number, string> = {
  1: '#4f7a4d', // sage
  2: '#f4c542', // sun
  3: '#c44b2b', // terra
  4: '#a99bd4', // lavender
  5: '#d4a574', // cream-ish
}

const TrustGraph: React.FC<Props> = ({ subject, attestations }) => {
  const issuers = useMemo(() => buildIssuers(attestations), [attestations])

  // SVG canvas dimensions
  const W = 520
  const H = 380
  const cx = W / 2
  const cy = H / 2
  const radius = Math.min(W, H) * 0.36

  return (
    <div className="nb-card bg-white rounded-2xl p-6 md:p-8 shadow-brutal">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <span className="nb-tag bg-cream text-charcoal/60 border-charcoal/15 text-[9px] mb-2">Trust Graph</span>
          <h3 className="font-display text-xl font-bold text-charcoal mt-1">Who vouches for you</h3>
          <p className="text-charcoal/50 text-sm mt-1 max-w-2xl">
            Each line is a signed attestation. Distinct issuers around the ring = breadth. Line thickness = number of attestations
            from that issuer.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-charcoal/35 mb-1">Issuers</div>
          <div className="font-display text-3xl font-extrabold text-charcoal leading-none">{issuers.length}</div>
        </div>
      </div>

      {issuers.length === 0 ? (
        <div className="bg-cream rounded-xl p-8 text-center">
          <div className="text-charcoal/55 text-sm mb-1">No vouches yet</div>
          <div className="text-charcoal/35 text-xs">As employers and clients attest to your work, they'll show up here.</div>
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl mx-auto block" style={{ minWidth: 320 }}>
            {/* Subtle grid background */}
            <defs>
              <pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#22231f" fillOpacity="0.04" />
              </pattern>
            </defs>
            <rect width={W} height={H} fill="url(#dots)" />

            {/* Ring guide */}
            <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#22231f" strokeOpacity="0.06" strokeDasharray="3 4" />

            {/* Edges (lines) — drawn before nodes so nodes overlap them */}
            {issuers.map((iss, i) => {
              const angle = (2 * Math.PI * i) / issuers.length - Math.PI / 2
              const x = cx + Math.cos(angle) * radius
              const y = cy + Math.sin(angle) * radius
              const thickness = Math.min(6, 1.5 + Math.log(iss.count + 1) * 1.5)
              return (
                <line
                  key={iss.address}
                  x1={cx}
                  y1={cy}
                  x2={x}
                  y2={y}
                  stroke={palette[iss.topCategory] ?? '#22231f'}
                  strokeOpacity="0.5"
                  strokeWidth={thickness}
                  strokeLinecap="round"
                />
              )
            })}

            {/* Issuer nodes */}
            {issuers.map((iss, i) => {
              const angle = (2 * Math.PI * i) / issuers.length - Math.PI / 2
              const x = cx + Math.cos(angle) * radius
              const y = cy + Math.sin(angle) * radius
              const nodeR = 14 + Math.min(8, Math.log(iss.count + 1) * 3)
              // Label position pushed further along the same ray
              const labelR = radius + 36
              const lx = cx + Math.cos(angle) * labelR
              const ly = cy + Math.sin(angle) * labelR
              return (
                <g key={iss.address}>
                  <circle
                    cx={x}
                    cy={y}
                    r={nodeR}
                    fill={palette[iss.topCategory] ?? '#22231f'}
                    stroke="#22231f"
                    strokeWidth="2"
                  />
                  <text
                    x={x}
                    y={y + 4}
                    textAnchor="middle"
                    fontFamily="monospace"
                    fontSize="11"
                    fill="#22231f"
                    fontWeight="700"
                  >
                    {iss.count}
                  </text>
                  <text
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    fontFamily="monospace"
                    fontSize="9"
                    fill="#22231f"
                    fillOpacity="0.55"
                  >
                    {truncate(iss.address, 4, 4)}
                  </text>
                </g>
              )
            })}

            {/* Subject node (center) */}
            <circle cx={cx} cy={cy} r="32" fill="#22231f" stroke="#c44b2b" strokeWidth="3" />
            <text
              x={cx}
              y={cy + 4}
              textAnchor="middle"
              fontFamily="monospace"
              fontSize="11"
              fill="#fef9ec"
              fontWeight="700"
            >
              YOU
            </text>
          </svg>
        </div>
      )}

      {/* Legend */}
      {issuers.length > 0 && (
        <div className="mt-5 pt-4 border-t-[1.5px] border-dashed border-charcoal/10 flex flex-wrap gap-3">
          {Array.from(new Set(issuers.map((i) => i.topCategory)))
            .sort()
            .map((cat) => (
              <div key={cat} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full border-2 border-charcoal"
                  style={{ backgroundColor: palette[cat] ?? '#22231f' }}
                />
                <span className="font-mono text-[10px] text-charcoal/55 uppercase tracking-wider">
                  {CATEGORY_LABELS[cat] ?? '—'}
                </span>
              </div>
            ))}
          <div className="ml-auto font-mono text-[10px] text-charcoal/35">
            line thickness ∝ log(attestations)
          </div>
        </div>
      )}
    </div>
  )
}

export default TrustGraph
