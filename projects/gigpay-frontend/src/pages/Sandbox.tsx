import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import algosdk from 'algosdk'
import AloraLogo from '../components/shared/AloraLogo'
import { getDemoWorker, getPublicViewer } from '../services/algorand'
import { runSandboxQuery, SandboxResponse, toAaResponse } from '../services/sandboxApi'

// ─────────────────────────────────────────────────────────────────────
// JsonViewer — minimal syntax-highlighted JSON renderer (no extra dep).
// ─────────────────────────────────────────────────────────────────────
const tokenize = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = []
  const re = /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|\b(true|false|null)\b|(-?\d+\.?\d*(?:[eE][+-]?\d+)?)|([{}[\],])/g
  let lastIndex = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push(text.slice(lastIndex, m.index))
    if (m[1]) parts.push(<span key={key++} className="text-terra">{m[1]}</span>)
    else if (m[2]) parts.push(<span key={key++} className="text-sage">{m[2]}</span>)
    else if (m[3]) parts.push(<span key={key++} className="text-lavender">{m[3]}</span>)
    else if (m[4]) parts.push(<span key={key++} className="text-sun">{m[4]}</span>)
    else if (m[5]) parts.push(<span key={key++} className="text-cream/65">{m[5]}</span>)
    lastIndex = re.lastIndex
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

const JsonViewer: React.FC<{ data: unknown }> = ({ data }) => {
  const text = JSON.stringify(data, null, 2)
  return (
    <pre className="font-mono text-[12px] leading-relaxed text-cream/85 overflow-x-auto whitespace-pre p-5 bg-charcoal rounded-xl border-[2.5px] border-charcoal">
      <code>{tokenize(text)}</code>
    </pre>
  )
}

// ─────────────────────────────────────────────────────────────────────
// CodeSnippet — copyable code block, multi-language tabs.
// ─────────────────────────────────────────────────────────────────────
type Lang = 'curl' | 'js' | 'python' | 'java'
const snippets = (address: string): Record<Lang, string> => ({
  curl: `curl -X GET "https://api.alora.id/v1/score/${address}" \\
  -H "Authorization: Bearer $ALORA_API_KEY" \\
  -H "Accept: application/json"`,
  js: `const response = await fetch(
  \`https://api.alora.id/v1/score/${address}\`,
  {
    headers: {
      Authorization: \`Bearer \${process.env.ALORA_API_KEY}\`,
      Accept: 'application/json',
    },
  },
)
const data = await response.json()`,
  python: `import os, httpx

response = httpx.get(
    f"https://api.alora.id/v1/score/${address}",
    headers={
        "Authorization": f"Bearer {os.environ['ALORA_API_KEY']}",
        "Accept": "application/json",
    },
    timeout=5.0,
)
data = response.json()`,
  java: `HttpRequest req = HttpRequest.newBuilder()
    .uri(URI.create("https://api.alora.id/v1/score/${address}"))
    .header("Authorization", "Bearer " + System.getenv("ALORA_API_KEY"))
    .header("Accept", "application/json")
    .GET()
    .build();

HttpResponse<String> res = HttpClient.newHttpClient()
    .send(req, BodyHandlers.ofString());`,
})

const CodeSnippet: React.FC<{ address: string }> = ({ address }) => {
  const [lang, setLang] = useState<Lang>('curl')
  const [copied, setCopied] = useState(false)
  const code = snippets(address)[lang]
  const tabs: { id: Lang; label: string }[] = [
    { id: 'curl', label: 'curl' },
    { id: 'js', label: 'JavaScript' },
    { id: 'python', label: 'Python' },
    { id: 'java', label: 'Java' },
  ]
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <div className="nb-card bg-charcoal rounded-2xl p-5 shadow-brutal-terra text-cream">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setLang(t.id)}
              className={`font-mono text-[11px] tracking-widest uppercase px-3 py-1.5 rounded-md transition-colors ${
                lang === t.id ? 'bg-terra text-cream' : 'bg-cream/[0.06] text-cream/60 hover:text-cream/85'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={copy}
          className="font-mono text-[10px] tracking-widest uppercase text-cream/55 hover:text-cream transition-colors"
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <pre className="font-mono text-[11px] leading-relaxed text-cream/85 overflow-x-auto whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────
// FieldReference — table of fields, types, what-it-replaces, examples.
// ─────────────────────────────────────────────────────────────────────
interface FieldRow {
  path: string
  type: string
  desc: string
  replaces: string
}

const FIELD_REF: FieldRow[] = [
  { path: 'aura_score', type: 'uint16 (1–1000)', desc: 'Reference score, CIBIL-shaped. Bands at 300/550/700/850.', replaces: 'CIBIL Score' },
  { path: 'band', type: 'enum', desc: 'Building · Fair · Good · Very Good · Excellent.', replaces: 'CIBIL classification' },
  { path: 'verified_monthly_income.mean', type: 'uint32 (INR)', desc: 'Mean monthly income derived from payment-proof attestations.', replaces: 'Salary slip / Form 16' },
  { path: 'verified_monthly_income.variance', type: 'float', desc: 'Coefficient of variation across observed months.', replaces: 'Income-stability inference' },
  { path: 'verified_monthly_income.distinct_payers', type: 'uint8', desc: 'Number of distinct paying employers in the observation window.', replaces: 'Employment-letter check' },
  { path: 'stability_index', type: 'uint8 (0–100)', desc: 'Composite: recency × diversification × tenure.', replaces: 'Form 16 / ITR' },
  { path: 'trust_signals.distinct_issuers', type: 'uint16', desc: 'Number of distinct issuers vouching for the worker.', replaces: 'Reference checks' },
  { path: 'trust_signals.vouches', type: 'uint16', desc: 'Active vouch-category attestations.', replaces: 'Personal references' },
  { path: 'trust_signals.revocation_rate', type: 'float (0–1)', desc: 'Revoked attestations as a share of total. Lower is better.', replaces: 'Background-check flags' },
  { path: 'tenure_months', type: 'uint16', desc: 'Months since earliest attestation (or registration if none).', replaces: 'Employment tenure proof' },
  { path: 'attestations_summary.by_category', type: 'object', desc: 'Active counts per category.', replaces: 'Skills inventory' },
  { path: 'consent.expires_at', type: 'uint64 (unix)', desc: 'When the worker-issued consent expires for this consumer.', replaces: 'Consent ledger' },
  { path: 'meta.latency_ms', type: 'uint32', desc: 'API latency for the most recent query.', replaces: '—' },
]

const FieldReference: React.FC = () => (
  <div className="nb-card bg-white rounded-2xl p-6 md:p-8 shadow-brutal">
    <div className="mb-5">
      <span className="nb-tag bg-cream text-charcoal/60 border-charcoal/15 text-[9px] mb-2">Field reference</span>
      <h3 className="font-display text-xl font-bold text-charcoal mt-1">Every field, documented.</h3>
      <p className="text-charcoal/50 text-sm mt-1 max-w-2xl">
        For each field — the type your underwriting engine receives, what it represents, and the traditional document it
        replaces.
      </p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left font-mono text-[12px]">
        <thead>
          <tr className="border-b-[2px] border-charcoal/10">
            <th className="py-2 pr-4 font-display text-[10px] uppercase tracking-widest text-charcoal/45">Path</th>
            <th className="py-2 pr-4 font-display text-[10px] uppercase tracking-widest text-charcoal/45">Type</th>
            <th className="py-2 pr-4 font-display text-[10px] uppercase tracking-widest text-charcoal/45">Description</th>
            <th className="py-2 font-display text-[10px] uppercase tracking-widest text-charcoal/45">Replaces</th>
          </tr>
        </thead>
        <tbody>
          {FIELD_REF.map((r) => (
            <tr key={r.path} className="border-b border-charcoal/[0.05] hover:bg-cream/40 transition-colors">
              <td className="py-3 pr-4 text-terra font-semibold whitespace-nowrap">{r.path}</td>
              <td className="py-3 pr-4 text-charcoal/55">{r.type}</td>
              <td className="py-3 pr-4 text-charcoal/75">{r.desc}</td>
              <td className="py-3 text-charcoal/55">{r.replaces}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

// ─────────────────────────────────────────────────────────────────────
// Main Sandbox page.
// ─────────────────────────────────────────────────────────────────────
const truncate = (s: string, head = 6, tail = 4) =>
  s.length > head + tail + 3 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s

const Sandbox: React.FC = () => {
  const demoWorker = getDemoWorker()
  const viewer = getPublicViewer()
  const [address, setAddress] = useState<string>(demoWorker || '')
  const [response, setResponse] = useState<SandboxResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shape, setShape] = useState<'native' | 'aa'>('native')

  const addressValid = address.length === 58 && algosdk.isValidAddress(address)

  const run = async () => {
    if (!addressValid) return
    setLoading(true)
    setError(null)
    setResponse(null)
    try {
      const r = await runSandboxQuery(address.trim(), viewer)
      setResponse(r)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Query failed')
    } finally {
      setLoading(false)
    }
  }

  const useDemo = () => {
    if (demoWorker) setAddress(demoWorker)
  }

  const displayed = useMemo(() => {
    if (!response) return null
    return shape === 'aa' ? toAaResponse(response) : response
  }, [response, shape])

  return (
    <div className="min-h-screen bg-cream text-charcoal font-sans">
      <div className="noise-overlay" />

      {/* Slim public nav */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 lg:px-20 py-5 border-b-[2.5px] border-charcoal bg-cream">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <AloraLogo size="md" />
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline font-mono text-[10px] tracking-[0.25em] uppercase text-charcoal/45">
            Bureau API · Sandbox
          </span>
          <a href="mailto:partners@alora.id" className="nb-btn bg-terra text-cream px-5 py-2.5 text-sm font-display font-bold uppercase">
            Talk to us →
          </a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 md:px-12 py-10 space-y-6">
        {/* Hero */}
        <div className="nb-card bg-charcoal text-cream rounded-2xl p-6 md:p-10 shadow-brutal-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-terra" />
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #fef9ec 1px, transparent 1px)',
              backgroundSize: '14px 14px',
            }}
          />
          <div className="relative">
            <h1 className="font-display text-3xl md:text-5xl font-extrabold leading-tight mb-3">
              Test the Alora bureau API <span className="text-terra italic font-serif font-normal">live.</span>
            </h1>
            <p className="text-cream/55 text-sm md:text-base max-w-2xl leading-relaxed">
              Paste any registered worker's wallet address. See the exact JSON your underwriting engine will receive. Run it from
              your stack with the snippets below. Sub-3-second response. On-chain primitives. AA-compatible shape available.
            </p>
          </div>
        </div>

        {/* Address input */}
        <div className="nb-card bg-white rounded-2xl p-6 md:p-8 shadow-brutal">
          <div className="flex items-end justify-between gap-4 mb-3 flex-wrap">
            <div>
              <span className="nb-tag bg-cream text-charcoal/60 border-charcoal/15 text-[9px] mb-2">Step 1</span>
              <h3 className="font-display text-xl font-bold text-charcoal mt-1">Pick a worker address</h3>
            </div>
            {demoWorker && (
              <button
                onClick={useDemo}
                className="font-mono text-[11px] tracking-widest uppercase text-terra hover:text-terra-dark transition-colors"
              >
                Use demo worker ↗
              </button>
            )}
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value.trim())}
              placeholder="Algorand wallet address (58 chars)"
              className="flex-1 px-4 py-3 border-[2.5px] border-charcoal/15 focus:border-charcoal rounded-lg bg-cream font-mono text-xs focus:outline-none"
            />
            <button
              onClick={run}
              disabled={!addressValid || loading}
              className="nb-btn bg-terra text-cream px-8 py-3 text-sm font-display font-bold tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Querying…' : 'Run Query →'}
            </button>
          </div>
          {address && !addressValid && (
            <div className="mt-2 text-[11px] text-terra">Address must be 58 characters of valid Algorand base32.</div>
          )}
          {error && (
            <div className="mt-3 border-[2px] border-terra/30 bg-terra-light text-terra text-xs px-3 py-2 rounded-lg">{error}</div>
          )}
        </div>

        {/* Response */}
        {response && (
          <div className="space-y-4">
            {/* Latency + status strip */}
            <div className="nb-card bg-white rounded-2xl p-5 shadow-brutal-sm">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-sage rounded-full border-[1.5px] border-charcoal" />
                  <span className="font-mono text-[11px] uppercase tracking-widest text-charcoal/55">
                    {response.status === 'ok' ? 'HTTP 200 · OK' : `HTTP 404 · ${response.status}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/35">Latency</span>
                  <span className="font-mono text-[12px] font-bold text-charcoal">{response.meta.latency_ms}ms</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/35">Score</span>
                  <span className="font-mono text-[12px] font-bold text-charcoal">
                    {response.aura_score} / 1000 · {response.band}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-charcoal/35">Address</span>
                  <span className="font-mono text-[12px] font-bold text-charcoal">{truncate(response.address, 6, 4)}</span>
                </div>
                <div className="ml-auto flex gap-1">
                  <button
                    onClick={() => setShape('native')}
                    className={`font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-md transition-colors ${
                      shape === 'native' ? 'bg-charcoal text-cream' : 'bg-cream text-charcoal/55 hover:text-charcoal'
                    }`}
                  >
                    Alora-native
                  </button>
                  <button
                    onClick={() => setShape('aa')}
                    className={`font-mono text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-md transition-colors ${
                      shape === 'aa' ? 'bg-charcoal text-cream' : 'bg-cream text-charcoal/55 hover:text-charcoal'
                    }`}
                  >
                    Sahamati AA
                  </button>
                </div>
              </div>
            </div>

            {/* JSON */}
            <div className="nb-card bg-white rounded-2xl p-5 md:p-6 shadow-brutal">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="nb-tag bg-cream text-charcoal/60 border-charcoal/15 text-[9px] mb-2">Step 2</span>
                  <h3 className="font-display text-lg font-bold text-charcoal mt-1">Response body</h3>
                </div>
                <span className="font-mono text-[10px] text-charcoal/35">
                  {shape === 'native' ? 'application/json' : 'application/vnd.aa-2.0+json'}
                </span>
              </div>
              <JsonViewer data={displayed} />
            </div>

            {/* Code snippets */}
            <div>
              <div className="mb-3">
                <span className="nb-tag bg-cream text-charcoal/60 border-charcoal/15 text-[9px] mb-2">Step 3</span>
                <h3 className="font-display text-xl font-bold text-charcoal mt-1">Run it from your stack</h3>
                <p className="text-charcoal/50 text-sm mt-1">
                  The hosted endpoint lands with the Phase 5 read-API gateway. The contracts that back it are already on chain
                  today.
                </p>
              </div>
              <CodeSnippet address={response.address} />
            </div>
          </div>
        )}

        {/* Field reference */}
        <FieldReference />

        {/* Auth / Rate limits */}
        <div className="nb-card bg-white rounded-2xl p-6 md:p-8 shadow-brutal-sage">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <span className="nb-tag bg-sage-light text-sage border-sage/40 text-[9px] mb-2">Auth</span>
              <h4 className="font-display text-base font-bold text-charcoal mt-1 mb-1">API key + worker consent</h4>
              <p className="text-charcoal/55 text-[12px] leading-relaxed">
                Bearer token issued at partner onboarding. Every query also verifies an on-chain grant from the worker — no
                grant, no data.
              </p>
            </div>
            <div>
              <span className="nb-tag bg-sun-light text-charcoal border-sun/40 text-[9px] mb-2">Rate limits</span>
              <h4 className="font-display text-base font-bold text-charcoal mt-1 mb-1">100 req/min · burst 500</h4>
              <p className="text-charcoal/55 text-[12px] leading-relaxed">
                Per API key. Enterprise tiers raise to 10k req/min with bulk-batch endpoints. Standard 429 backoff semantics.
              </p>
            </div>
            <div>
              <span className="nb-tag bg-lavender/30 text-charcoal border-lavender/50 text-[9px] mb-2">SLA</span>
              <h4 className="font-display text-base font-bold text-charcoal mt-1 mb-1">99.9% uptime · &lt;3s p99</h4>
              <p className="text-charcoal/55 text-[12px] leading-relaxed">
                Production SLA on the Growth tier. Enterprise: 99.99% with on-prem read-replica option.
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="nb-card bg-charcoal text-cream rounded-2xl p-6 md:p-8 shadow-brutal text-center">
          <h3 className="font-display text-2xl md:text-3xl font-extrabold mb-2">Ready to integrate?</h3>
          <p className="text-cream/55 text-sm max-w-xl mx-auto mb-5">
            Two engineer-weeks on your side. We provide the integration spec, the MoU draft, and a sandbox key on the kickoff
            call.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="mailto:partners@alora.id"
              className="nb-btn bg-terra text-cream px-8 py-4 text-sm font-display font-bold tracking-widest uppercase"
            >
              Book a 30-min call
            </a>
            <Link
              to="/consumer"
              className="nb-btn bg-cream/10 text-cream px-8 py-4 text-sm font-display font-bold tracking-widest uppercase border-cream/20"
            >
              Consumer dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sandbox
