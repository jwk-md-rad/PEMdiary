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
      Orthostatisch: e.orthostatisch,
      Energie: e.energie,
      Slaap: e.slaap,
    }))

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
                Orthostatisch: 1 = ernstig, 5 = geen klachten · Energie &amp; Slaap: 1 = slecht, 5 = goed
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
