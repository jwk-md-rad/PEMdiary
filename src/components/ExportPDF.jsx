import { useData } from '../contexts/DataContext.jsx'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

function fmtDatum(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

function fmtDatumLang(iso) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

function pearson(xs, ys) {
  const n = xs.length
  if (n < 5) return null
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let num = 0, dx2 = 0, dy2 = 0
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my
    num += dx * dy; dx2 += dx * dx; dy2 += dy * dy
  }
  if (dx2 === 0 || dy2 === 0) return null
  return Math.round(num / Math.sqrt(dx2 * dy2) * 100) / 100
}

function rLabel(r) {
  if (r === null) return { tekst: '—', kleur: '#94a3b8' }
  const a = Math.abs(r)
  const teken = r > 0 ? '+' : ''
  const sterkte = a >= 0.6 ? 'sterk' : a >= 0.3 ? 'matig' : 'zwak'
  const kleur = a >= 0.6 ? '#1d4ed8' : a >= 0.3 ? '#374151' : '#94a3b8'
  return { tekst: `${teken}${r.toFixed(2)} (${sterkte})`, kleur }
}

export default function ExportPDF({ onSluiten }) {
  const { dagboek, tests } = useData()

  const vandaag = new Date().toLocaleDateString('nl-NL', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  // All diary entries with HR or HRV, oldest first
  const hrData = [...dagboek]
    .filter(e => e.ochtendHR !== '' || e.hrv !== '')
    .reverse()
    .map(e => ({
      datum: fmtDatum(e.datum),
      HR: e.ochtendHR !== '' ? Number(e.ochtendHR) : null,
      HRV: e.hrv !== '' ? Number(e.hrv) : null,
    }))

  const hasHR  = hrData.some(d => d.HR  !== null)
  const hasHRV = hrData.some(d => d.HRV !== null)

  // Score trend — max 60 entries, oldest first
  const scoreData = [...dagboek]
    .slice(0, 60)
    .reverse()
    .map(e => ({
      datum: fmtDatum(e.datum),
      Orthostatisch: 6 - e.orthostatisch,  // omgekeerd: hoog = weinig klachten
      Energie: e.energie,
      Slaap: e.slaap,
    }))

  // Correlaties: entries met HR én scores / HRV én scores
  const hrEntries  = dagboek.filter(e => e.ochtendHR !== '')
  const hrvEntries = dagboek.filter(e => e.hrv !== '')

  const hrVals  = hrEntries.map(e => Number(e.ochtendHR))
  const hrvVals = hrvEntries.map(e => Number(e.hrv))

  const cor = {
    nHR:  hrEntries.length,
    nHRV: hrvEntries.length,
    hr: {
      ortho:   pearson(hrVals,  hrEntries.map(e => e.orthostatisch)),
      energie: pearson(hrVals,  hrEntries.map(e => e.energie)),
      slaap:   pearson(hrVals,  hrEntries.map(e => e.slaap)),
    },
    hrv: {
      ortho:   pearson(hrvVals, hrvEntries.map(e => e.orthostatisch)),
      energie: pearson(hrvVals, hrvEntries.map(e => e.energie)),
      slaap:   pearson(hrvVals, hrvEntries.map(e => e.slaap)),
    },
  }

  const heeftCorrelaties = cor.nHR >= 5 || cor.nHRV >= 5

  // Dienst analyse — lag-1: dienst dag N → metrics dag N+1
  const DIENST_VOLGORDE = [
    { key: '',      label: 'Vrij'        },
    { key: 'dag',   label: 'Dagdienst'   },
    { key: 'avond', label: 'Avonddienst' },
  ]

  // Build consecutive-day pairs (only days that directly follow each other)
  const chronologisch = [...dagboek].reverse() // oldest first
  const lagPairs = []
  for (let i = 0; i < chronologisch.length - 1; i++) {
    const dagN   = chronologisch[i]
    const dagN1  = chronologisch[i + 1]
    const msVerschil = new Date(dagN1.datum + 'T00:00:00') - new Date(dagN.datum + 'T00:00:00')
    if (Math.round(msVerschil / 86400000) !== 1) continue // skip non-consecutive
    lagPairs.push({
      dienst:  dagN.dienst || '',
      werkend: (dagN.dienst && dagN.dienst !== '') ? 1 : 0,
      orthostatisch: dagN1.orthostatisch,
      energie:       dagN1.energie,
      slaap:         dagN1.slaap,
      ochtendHR:     dagN1.ochtendHR,
      hrv:           dagN1.hrv,
    })
  }

  const lagGroepen = { '': [], dag: [], avond: [] }
  lagPairs.forEach(p => { lagGroepen[p.dienst].push(p) })

  function gem(items, key) {
    const vals = items
      .map(p => Number(p[key]))
      .filter(v => !isNaN(v) && v > 0)
    return vals.length >= 2
      ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10
      : null
  }

  // Point-biserial: werkend(0/1) vs next-day metric
  function dienstCorr(key) {
    const pairs = lagPairs.filter(p => p[key] !== '' && !isNaN(Number(p[key])) && Number(p[key]) > 0)
    if (pairs.length < 5) return null
    return pearson(pairs.map(p => p.werkend), pairs.map(p => Number(p[key])))
  }

  const corDienst = {
    n:       lagPairs.length,
    ortho:   dienstCorr('orthostatisch'),
    energie: dienstCorr('energie'),
    slaap:   dienstCorr('slaap'),
    hr:      dienstCorr('ochtendHR'),
    hrv:     dienstCorr('hrv'),
  }

  const heeftDienstData = lagPairs.length >= 5

  // NASA tests oldest-first for the table
  const testsChronologisch = [...tests].reverse()

  const daterenVan = dagboek.length > 0
    ? fmtDatumLang(dagboek[dagboek.length - 1].datum)
    : null
  const daterenTot = dagboek.length > 0
    ? fmtDatumLang(dagboek[0].datum)
    : null

  return (
    <div className="export-modal-root fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="max-w-2xl mx-auto print:max-w-full">

        {/* ── Screen header (hidden when printing) ── */}
        <div className="print:hidden sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Exporteren als PDF</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {hrData.length} HR/HRV metingen · {tests.length} NASA Lean Tests
            </p>
          </div>
          <button onClick={onSluiten} className="p-2 text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Print header (hidden on screen) ── */}
        <div className="hidden print:block px-8 pt-8 pb-5" style={{ borderBottom: '2px solid #2563eb' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e3a8a', margin: '0 0 4px' }}>
            PEM Dagboek — Rapport
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: 13 }}>
            Gegenereerd op {vandaag}
            {daterenVan && ` · Data: ${daterenVan} – ${daterenTot}`}
          </p>
        </div>

        {/* ── Charts & table ── */}
        <div className="px-5 py-6 print:px-8 print:py-8 space-y-10">

          {/* Ochtend HR */}
          {hasHR && (
            <section>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 print:text-base print:mb-4">
                Ochtend hartslag (bpm)
              </h3>
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={hrData} margin={{ top: 5, right: 12, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="datum" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    formatter={v => [`${v} bpm`, 'HR']}
                  />
                  <Line
                    type="monotone" dataKey="HR" stroke="#ef4444" strokeWidth={2}
                    dot={{ r: 3, fill: '#ef4444' }} connectNulls name="HR (bpm)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </section>
          )}

          {/* HRV */}
          {hasHRV && (
            <section>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 print:text-base print:mb-4">
                HRV (ms)
              </h3>
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={hrData} margin={{ top: 5, right: 12, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="datum" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    formatter={v => [`${v} ms`, 'HRV']}
                  />
                  <Line
                    type="monotone" dataKey="HRV" stroke="#8b5cf6" strokeWidth={2}
                    dot={{ r: 3, fill: '#8b5cf6' }} connectNulls name="HRV (ms)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </section>
          )}

          {/* No HR/HRV data */}
          {!hasHR && !hasHRV && (
            <div className="bg-slate-50 rounded-xl p-6 text-center print:border print:border-slate-200">
              <p className="text-slate-400 text-sm">Nog geen HR/HRV metingen gelogd.</p>
              <p className="text-xs text-slate-400 mt-1">Voeg ochtend-HR en HRV toe via het dagboekformulier.</p>
            </div>
          )}

          {/* Scores trend */}
          {scoreData.length > 1 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 print:text-base print:mb-4">
                Dagelijkse scores (1–5)
              </h3>
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={scoreData} margin={{ top: 5, right: 12, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="datum" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="Orthostatisch" stroke="#ef4444" strokeWidth={2} dot={false} connectNulls />
                  <Line type="monotone" dataKey="Energie"       stroke="#16a34a" strokeWidth={2} dot={false} connectNulls />
                  <Line type="monotone" dataKey="Slaap"         stroke="#2563eb" strokeWidth={2} dot={false} connectNulls />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-400 mt-1">
                Alle lijnen: hoog = goed · Orthostatisch is omgekeerd weergegeven (5 = geen klachten)
              </p>
            </section>
          )}

          {/* Correlaties */}
          {heeftCorrelaties && (
            <section>
              <h3 className="text-sm font-semibold text-slate-700 mb-1 print:text-base">
                Correlaties scores ↔ HR &amp; HRV
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Pearson r · |r| ≥ 0,6 sterk · 0,3–0,6 matig · &lt;0,3 zwak · minimaal 5 gekoppelde metingen vereist
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="p-2 border border-slate-200 text-left text-slate-600 font-semibold">Score</th>
                      {cor.nHR >= 5 && (
                        <th className="p-2 border border-slate-200 text-center text-red-700 font-semibold">
                          Ochtend HR (n={cor.nHR})
                        </th>
                      )}
                      {cor.nHRV >= 5 && (
                        <th className="p-2 border border-slate-200 text-center text-purple-700 font-semibold">
                          HRV (n={cor.nHRV})
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'ortho',   label: 'Orthostatisch *', noot: true },
                      { key: 'energie', label: 'Energie' },
                      { key: 'slaap',   label: 'Slaap' },
                    ].map(({ key, label }) => (
                      <tr key={key} className="even:bg-slate-50">
                        <td className="p-2 border border-slate-200 text-slate-700 font-medium">{label}</td>
                        {cor.nHR >= 5 && (() => {
                          const { tekst, kleur } = rLabel(cor.hr[key])
                          return (
                            <td className="p-2 border border-slate-200 text-center font-mono"
                                style={{ color: kleur }}>{tekst}</td>
                          )
                        })()}
                        {cor.nHRV >= 5 && (() => {
                          const { tekst, kleur } = rLabel(cor.hrv[key])
                          return (
                            <td className="p-2 border border-slate-200 text-center font-mono"
                                style={{ color: kleur }}>{tekst}</td>
                          )
                        })()}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                * Orthostatisch: score 1 = geen klachten, 5 = ernstig — positieve r met HR betekent: hogere HR ging samen met meer klachten.
              </p>
            </section>
          )}

          {/* Dienst analyse */}
          {heeftDienstData && (
            <section>
              <h3 className="text-sm font-semibold text-slate-700 mb-1 print:text-base">
                Dienst dag N → volgende dag (lag-1)
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Gemiddelde scores/HR/HRV op de dag <em>na</em> het diensttype · {lagPairs.length} opeenvolgende dagenparen
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="p-2 border border-slate-200 text-left text-slate-600 font-semibold">Dienst</th>
                      <th className="p-2 border border-slate-200 text-center text-slate-600 font-semibold">n</th>
                      <th className="p-2 border border-slate-200 text-center text-slate-600 font-semibold">Ortho *</th>
                      <th className="p-2 border border-slate-200 text-center text-slate-600 font-semibold">Energie</th>
                      <th className="p-2 border border-slate-200 text-center text-slate-600 font-semibold">Slaap</th>
                      <th className="p-2 border border-slate-200 text-center text-red-700 font-semibold">HR</th>
                      <th className="p-2 border border-slate-200 text-center text-purple-700 font-semibold">HRV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DIENST_VOLGORDE.map(({ key, label }) => {
                      const groep = lagGroepen[key]
                      if (groep.length === 0) return null
                      return (
                        <tr key={key} className="even:bg-slate-50">
                          <td className="p-2 border border-slate-200 font-medium text-slate-700">{label}</td>
                          <td className="p-2 border border-slate-200 text-center text-slate-500">{groep.length}</td>
                          <td className="p-2 border border-slate-200 text-center text-slate-600">{gem(groep, 'orthostatisch') ?? '—'}</td>
                          <td className="p-2 border border-slate-200 text-center text-slate-600">{gem(groep, 'energie')       ?? '—'}</td>
                          <td className="p-2 border border-slate-200 text-center text-slate-600">{gem(groep, 'slaap')         ?? '—'}</td>
                          <td className="p-2 border border-slate-200 text-center text-slate-600">{gem(groep, 'ochtendHR')     ?? '—'}</td>
                          <td className="p-2 border border-slate-200 text-center text-slate-600">{gem(groep, 'hrv')           ?? '—'}</td>
                        </tr>
                      )
                    })}
                    {/* Correlation row */}
                    {corDienst.n >= 5 && (
                      <tr className="border-t-2 border-slate-300 bg-blue-50">
                        <td className="p-2 border border-slate-200 font-semibold text-blue-800" colSpan={2}>r werkend vs. vrij</td>
                        {[corDienst.ortho, corDienst.energie, corDienst.slaap, corDienst.hr, corDienst.hrv].map((r, i) => {
                          const { tekst, kleur } = rLabel(r)
                          return (
                            <td key={i} className="p-2 border border-slate-200 text-center font-mono text-xs"
                                style={{ color: kleur }}>{tekst}</td>
                          )
                        })}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                * Orthostatisch 1 = geen klachten, 5 = ernstig · r werkend vs. vrij: positief = werkdag voorspelt hogere score volgende dag.
              </p>
            </section>
          )}

          {/* NASA Lean Test table */}
          {testsChronologisch.length > 0 && (
            <section style={{ breakBefore: 'auto', pageBreakBefore: 'auto' }}>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 print:text-base print:mb-4">
                NASA Lean Tests
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-blue-50">
                      {['Datum','Liggend','2 min','4 min','6 min','8 min','10 min','Δ bpm','Herstel'].map(h => (
                        <th key={h} className="p-2 border border-slate-200 text-blue-800 font-semibold text-center first:text-left whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {testsChronologisch.map(t => (
                      <tr key={t.id} className="even:bg-slate-50">
                        <td className="p-2 border border-slate-200 text-slate-700 whitespace-nowrap">{fmtDatum(t.datum)}</td>
                        <td className="p-2 border border-slate-200 text-center text-slate-600">{t.hrBaseline || '—'}</td>
                        <td className="p-2 border border-slate-200 text-center text-slate-600">{t.hr2  || '—'}</td>
                        <td className="p-2 border border-slate-200 text-center text-slate-600">{t.hr4  || '—'}</td>
                        <td className="p-2 border border-slate-200 text-center text-slate-600">{t.hr6  || '—'}</td>
                        <td className="p-2 border border-slate-200 text-center text-slate-600">{t.hr8  || '—'}</td>
                        <td className="p-2 border border-slate-200 text-center text-slate-600">{t.hr10 || '—'}</td>
                        <td className={`p-2 border border-slate-200 text-center font-bold ${
                          t.verschil >= 30  ? 'text-red-600'    :
                          t.verschil >= 20  ? 'text-orange-600' :
                          t.verschil != null ? 'text-green-600' : 'text-slate-400'
                        }`}>
                          {t.verschil != null ? `+${t.verschil}` : '—'}
                        </td>
                        <td className="p-2 border border-slate-200 text-center text-slate-600">{t.hrNaLiggen || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Δ bpm ≥ 30 = POTS-drempel bereikt &nbsp;·&nbsp; 20–29 = grensgebied &nbsp;·&nbsp; &lt;20 = normaal
              </p>
            </section>
          )}

        </div>

        {/* ── Print button (hidden when printing) ── */}
        <div className="print:hidden px-5 pb-8 pt-2 space-y-2 border-t border-slate-100">
          <button
            onClick={() => window.print()}
            className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Afdrukken / Opslaan als PDF
          </button>
          <p className="text-xs text-slate-400 text-center">
            iOS: kies "Opslaan als PDF" in het printdialoog
          </p>
        </div>

      </div>
    </div>
  )
}
