import React, { useState } from 'react'
import { AttestationRecord, CATEGORY_LABELS } from '../../services/attestations'
import { bytesToHex } from '../../services/vault'

export interface IssuePrefill {
  subject: string
  category?: number
  claim?: string
}

interface Props {
  history: AttestationRecord[]
  loading: boolean
  onIssue: (prefill: IssuePrefill) => void
}

const truncate = (s: string, head = 6, tail = 4) =>
  s.length > head + tail + 3 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s

interface WorkerGroup {
  subject: string
  attestations: AttestationRecord[]
  lastIssuedAt: bigint
  topCategory: number
}

const groupBySubject = (atts: AttestationRecord[]): WorkerGroup[] => {
  const map = new Map<string, AttestationRecord[]>()
  for (const a of atts) {
    if (!map.has(a.subject)) map.set(a.subject, [])
    map.get(a.subject)!.push(a)
  }
  const groups: WorkerGroup[] = []
  for (const [subject, list] of map.entries()) {
    const lastIssuedAt = list.reduce((m, a) => (a.issuedAt > m ? a.issuedAt : m), 0n)
    const counts = new Map<number, number>()
    for (const a of list) counts.set(a.category, (counts.get(a.category) ?? 0) + 1)
    const topCategory = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0]
    groups.push({ subject, attestations: list, lastIssuedAt, topCategory })
  }
  // Most-recently-engaged workers first.
  groups.sort((a, b) => Number(b.lastIssuedAt - a.lastIssuedAt))
  return groups
}

const WorkforceRoster: React.FC<Props> = ({ history, loading, onIssue }) => {
  const [expanded, setExpanded] = useState<string | null>(null)
  const groups = groupBySubject(history)

  return (
    <div className="nb-card bg-white rounded-2xl p-6 md:p-8 shadow-brutal-sage">
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <span className="nb-tag bg-sage-light text-sage border-sage/40 text-[9px] mb-2">Workforce</span>
          <h3 className="font-display text-xl font-bold text-charcoal mt-1">Your roster</h3>
          <p className="text-charcoal/50 text-sm mt-1">
            Every worker you've attested to, grouped. Issue follow-up records, see their on-chain timeline, refer them to capital
            partners.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-charcoal/35 mb-1">Workers</div>
          <div className="font-display text-3xl font-extrabold text-charcoal leading-none">{groups.length}</div>
        </div>
      </div>

      {loading ? (
        <div className="text-charcoal/45 text-sm py-6 text-center">Loading roster…</div>
      ) : groups.length === 0 ? (
        <div className="bg-cream rounded-xl p-6 text-center">
          <div className="text-charcoal/55 text-sm mb-1">No workers yet</div>
          <div className="text-charcoal/35 text-xs">Issue your first attestation above to start building your roster.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => {
            const isOpen = expanded === g.subject
            const lastDate = new Date(Number(g.lastIssuedAt) * 1000)
            return (
              <div key={g.subject} className="border-[1.5px] border-charcoal/10 rounded-xl bg-cream/30 overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : g.subject)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-cream/60 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-sage rounded-lg border-2 border-charcoal flex items-center justify-center shrink-0">
                      <span className="text-cream text-sm font-display font-bold">
                        {g.subject.slice(0, 1)}
                      </span>
                    </div>
                    <div>
                      <div className="font-mono text-xs text-charcoal font-semibold">{truncate(g.subject, 8, 6)}</div>
                      <div className="font-mono text-[10px] text-charcoal/45 mt-0.5">
                        Last engaged {lastDate.toLocaleDateString()} · {CATEGORY_LABELS[g.topCategory]}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="nb-tag bg-sage-light text-sage border-sage/30 text-[9px]">{g.attestations.length} att</span>
                    <span className="text-charcoal/30 text-xs">{isOpen ? '▾' : '▸'}</span>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-0 border-t-[1.5px] border-charcoal/10 bg-white">
                    <div className="space-y-2 mt-3">
                      {g.attestations.map((a) => {
                        const issued = new Date(Number(a.issuedAt) * 1000)
                        return (
                          <div key={Array.from(a.id).join('')} className="flex items-center justify-between text-xs py-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-charcoal/70 font-semibold">{CATEGORY_LABELS[a.category]}</span>
                              <span className="font-mono text-charcoal/35">{issued.toLocaleDateString()}</span>
                              {a.revoked && (
                                <span className="nb-tag bg-terra-light text-terra border-terra/30 text-[8px]">Revoked</span>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-charcoal/35">{bytesToHex(a.id).slice(0, 10)}…</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t-[1.5px] border-dashed border-charcoal/10">
                      <button
                        onClick={() => onIssue({ subject: g.subject })}
                        className="nb-btn bg-terra text-cream px-3 py-1.5 text-[10px] font-display font-bold tracking-widest uppercase"
                      >
                        Issue New
                      </button>
                      <button
                        onClick={() => onIssue({ subject: g.subject, category: 3, claim: 'Salary disbursement — ' })}
                        className="nb-btn bg-charcoal text-cream px-3 py-1.5 text-[10px] font-display font-bold tracking-widest uppercase"
                      >
                        Record Salary
                      </button>
                      <button
                        onClick={() => onIssue({ subject: g.subject, category: 2, claim: 'Skill verified — ' })}
                        className="nb-btn bg-cream text-charcoal px-3 py-1.5 text-[10px] font-display font-bold tracking-widest uppercase"
                      >
                        Verify Skill
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default WorkforceRoster
