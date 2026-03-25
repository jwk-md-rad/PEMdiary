import { SYMPTOOM_LABELS, formatDatum, symptoomBgKleur, symptoomKleur, gemSymptoomScore, KWALITEIT_LABELS } from '../utils/helpers.js'

const TIMEPOINTS = [
  { key: 't0', label: 'Avond (t=0)' },
  { key: 't24', label: '+24 uur' },
  { key: 't48', label: '+48 uur' },
  { key: 't72', label: '+72 uur' },
]

function SymptomenTabel({ symptomen }) {
  const keys = Object.keys(SYMPTOOM_LABELS)
  const aanwezig = TIMEPOINTS.filter(tp => symptomen[tp.key] !== null && symptomen[tp.key] !== undefined)

  if (aanwezig.length === 0) return <p className="text-xs text-slate-400 italic">Nog geen symptomen ingevuld</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left text-slate-500 font-medium py-1.5 pr-3">Symptoom</th>
            {aanwezig.map(tp => (
              <th key={tp.key} className="text-center text-slate-500 font-medium py-1.5 px-2">{tp.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {keys.map(k => (
            <tr key={k} className="border-b border-slate-50">
              <td className="text-slate-600 py-2 pr-3">{SYMPTOOM_LABELS[k]}</td>
              {aanwezig.map(tp => {
                const waarde = symptomen[tp.key]?.[k]
                return (
                  <td key={tp.key} className="text-center py-2 px-2">
                    <span className={`font-bold text-sm ${waarde != null ? symptoomKleur(waarde) : 'text-slate-300'}`}>
                      {waarde != null ? waarde : '–'}
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
          <tr className="border-t-2 border-slate-200">
            <td className="text-slate-600 font-semibold py-2 pr-3">Gemiddeld</td>
            {aanwezig.map(tp => {
              const gem = gemSymptoomScore(symptomen[tp.key])
              return (
                <td key={tp.key} className="text-center py-2 px-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${symptoomBgKleur(gem)}`}>
                    {gem}
                  </span>
                </td>
              )
            })}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function PEMIndicator({ entry }) {
  const t0gem = gemSymptoomScore(entry.symptomen?.t0)
  const tps = ['t24', 't48', 't72']
  const latere = tps.map(tp => ({ tp, gem: gemSymptoomScore(entry.symptomen?.[tp]) })).filter(x => x.gem !== null)

  if (!t0gem || latere.length === 0) return null

  const maxStijging = Math.max(...latere.map(x => x.gem - t0gem))
  const maxTp = latere.find(x => x.gem - t0gem === maxStijging)

  if (maxStijging <= 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
        <span className="text-green-500 text-lg">✓</span>
        <div>
          <p className="text-xs font-semibold text-green-700">Geen PEM toename</p>
          <p className="text-xs text-green-600">Symptomen zijn niet gestegen na activiteit</p>
        </div>
      </div>
    )
  }

  const kleur = maxStijging <= 1 ? 'yellow' : maxStijging <= 2 ? 'orange' : 'red'
  const kleuren = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700 text-yellow-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-700 text-orange-600',
    red: 'bg-red-50 border-red-200 text-red-700 text-red-600',
  }
  const [bg, border, title, desc] = kleuren[kleur].split(' ')

  return (
    <div className={`${bg} border ${border} rounded-lg p-3 flex items-center gap-2`}>
      <span className="text-lg">{kleur === 'yellow' ? '⚠️' : '🔴'}</span>
      <div>
        <p className={`text-xs font-semibold ${title}`}>
          PEM toename: +{maxStijging} punten op {maxTp?.tp.replace('t', '+')}u
        </p>
        <p className={`text-xs ${desc}`}>
          t=0: {t0gem} → max: {Math.max(...latere.map(x => x.gem))} gemiddeld
        </p>
      </div>
    </div>
  )
}

export default function EntryDetail({ entry, onBewerken, onTerug }) {
  const heeftOntbrekendeTps = TIMEPOINTS.some(tp => tp.key !== 't0' && entry.symptomen[tp.key] === null)

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onTerug} className="text-slate-400 hover:text-slate-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h2 className="text-base font-bold text-slate-900">{formatDatum(entry.datum)}</h2>
        </div>
        <button
          onClick={() => onBewerken(entry, null)}
          className="btn-secondary text-sm py-1.5"
        >
          Bewerken
        </button>
      </div>

      {/* PEM indicator */}
      <PEMIndicator entry={entry} />

      {/* Follow-up knoppen */}
      {heeftOntbrekendeTps && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-orange-700 mb-2">Symptomen aanvullen:</p>
          <div className="flex gap-2 flex-wrap">
            {TIMEPOINTS.filter(tp => tp.key !== 't0' && entry.symptomen[tp.key] === null).map(tp => (
              <button
                key={tp.key}
                onClick={() => onBewerken(entry, { timepoint: tp.key, label: tp.label })}
                className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-orange-600"
              >
                + {tp.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nachtrust */}
      {entry.nachtrust && (
        <div className="card">
          <h3 className="section-title">
            <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            Nachtrust
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">Slaapduur</p>
              <p className="font-semibold">{entry.nachtrust.duur ? `${entry.nachtrust.duur} uur` : '–'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Kwaliteit</p>
              <p className="font-semibold">{KWALITEIT_LABELS[entry.nachtrust.kwaliteit] || '–'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Nacht-HR</p>
              <p className="font-semibold">{entry.nachtrust.nachtHR ? `${entry.nachtrust.nachtHR} bpm` : '–'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">HRV</p>
              <p className="font-semibold">{entry.nachtrust.hrv || '–'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Activiteiten */}
      <div className="card">
        <h3 className="section-title">
          <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Activiteiten ({entry.activiteiten?.length || 0})
        </h3>
        {entry.activiteiten?.length === 0 ? (
          <p className="text-xs text-slate-400 italic">Geen activiteiten gelogd</p>
        ) : (
          <div className="space-y-2">
            {entry.activiteiten.map((act, i) => (
              <div key={i} className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {act.tijd && <span className="text-xs text-slate-400">{act.tijd}</span>}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                        act.type === 'fysiek' ? 'bg-emerald-100 text-emerald-700' :
                        act.type === 'mentaal' ? 'bg-purple-100 text-purple-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{act.type}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 mt-1">{act.activiteit || 'Onbekend'}</p>
                    {act.opmerkingen && <p className="text-xs text-slate-500 mt-0.5">{act.opmerkingen}</p>}
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <span className={`text-sm font-bold ${
                      act.rpe <= 3 ? 'text-green-600' : act.rpe <= 6 ? 'text-yellow-600' : 'text-red-600'
                    }`}>RPE {act.rpe}</span>
                    {act.duur && <p className="text-xs text-slate-400">{act.duur} min</p>}
                  </div>
                </div>
                {(act.gemHR || act.maxHR) && (
                  <div className="flex gap-3 mt-2 text-xs text-slate-500">
                    {act.gemHR && <span>Gem. HR: {act.gemHR} bpm</span>}
                    {act.maxHR && <span>Max HR: {act.maxHR} bpm</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Symptomen tabel */}
      <div className="card">
        <h3 className="section-title">
          <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Symptomen (0–10 schaal)
        </h3>
        <SymptomenTabel symptomen={entry.symptomen} />
      </div>

      {/* Extra */}
      {entry.extra && (entry.extra.rustHROchtend || entry.extra.medicatie || entry.extra.cafeine || entry.extra.alcohol || entry.extra.notities) && (
        <div className="card">
          <h3 className="section-title">
            <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Extra
          </h3>
          <div className="space-y-2 text-sm">
            {entry.extra.rustHROchtend && (
              <div className="flex justify-between">
                <span className="text-slate-500">Rust-HR ochtend</span>
                <span className="font-medium">{entry.extra.rustHROchtend} bpm</span>
              </div>
            )}
            {entry.extra.medicatie && (
              <div className="flex justify-between">
                <span className="text-slate-500">Medicatie</span>
                <span className="font-medium text-right max-w-48 break-words">{entry.extra.medicatie}</span>
              </div>
            )}
            <div className="flex gap-3">
              {entry.extra.cafeine && <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">Cafeïne</span>}
              {entry.extra.alcohol && <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">Alcohol</span>}
            </div>
            {entry.extra.notities && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Notities</p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-2">{entry.extra.notities}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <button onClick={onTerug} className="btn-secondary w-full">
        Terug naar overzicht
      </button>
    </div>
  )
}
