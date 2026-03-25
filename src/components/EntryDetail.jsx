import { SYMPTOOM_LABELS, formatDatum, formatDatumKort, symptoomBgKleur, symptoomKleur, gemSymptoomScore, KWALITEIT_LABELS } from '../utils/helpers.js'
import { berekenPEMpatronen } from '../utils/storage.js'

const TIMEPOINTS = [
  { key: 't0', label: 'Zelfde dag' },
  { key: 't24', label: '+24 uur' },
  { key: 't48', label: '+48 uur' },
  { key: 't72', label: '+72 uur' },
]

function PEMKorrelatieTabel({ patroon }) {
  if (!patroon) return null
  const aanwezig = TIMEPOINTS.filter(tp => patroon[tp.key] !== null)
  if (aanwezig.length < 2) return (
    <p className="text-xs text-slate-400 italic">
      Log de volgende dagen ook om het PEM patroon te zien.
    </p>
  )

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
          {Object.entries(SYMPTOOM_LABELS).map(([k, naam]) => (
            <tr key={k} className="border-b border-slate-50">
              <td className="text-slate-600 py-2 pr-3">{naam}</td>
              {aanwezig.map(tp => {
                const waarde = patroon[tp.key]?.[k]
                const t0waarde = patroon.t0?.[k]
                const stijging = tp.key !== 't0' && waarde != null && t0waarde != null
                  ? waarde - t0waarde : null
                return (
                  <td key={tp.key} className="text-center py-2 px-2">
                    <span className={`font-bold text-sm ${waarde != null ? symptoomKleur(waarde) : 'text-slate-300'}`}>
                      {waarde != null ? waarde : '–'}
                    </span>
                    {stijging !== null && stijging !== 0 && (
                      <span className={`block text-xs ${stijging > 0 ? 'text-red-400' : 'text-green-500'}`}>
                        {stijging > 0 ? `+${stijging}` : stijging}
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
          <tr className="border-t-2 border-slate-200">
            <td className="text-slate-600 font-semibold py-2 pr-3">Gemiddeld</td>
            {aanwezig.map(tp => {
              const gem = gemSymptoomScore(patroon[tp.key])
              return (
                <td key={tp.key} className="text-center py-2 px-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${gem != null ? symptoomBgKleur(gem) : ''}`}>
                    {gem ?? '–'}
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

function PEMIndicator({ patroon }) {
  if (!patroon) return null
  const t0gem = gemSymptoomScore(patroon.t0)
  const latere = ['t24', 't48', 't72'].map(tp => patroon[tp]).filter(Boolean)
  if (t0gem === null || latere.length === 0) return null

  const maxGem = Math.max(...latere.map(s => gemSymptoomScore(s)))
  const stijging = Math.round((maxGem - t0gem) * 10) / 10

  if (stijging <= 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
        <span className="text-green-500 text-lg">✓</span>
        <div>
          <p className="text-xs font-semibold text-green-700">Geen PEM toename</p>
          <p className="text-xs text-green-600">Symptomen zijn niet gestegen na deze dag</p>
        </div>
      </div>
    )
  }

  const [bg, border, titleKleur, descKleur] = stijging <= 1
    ? ['bg-yellow-50', 'border-yellow-200', 'text-yellow-700', 'text-yellow-600']
    : stijging <= 2
    ? ['bg-orange-50', 'border-orange-200', 'text-orange-700', 'text-orange-600']
    : ['bg-red-50', 'border-red-200', 'text-red-700', 'text-red-600']

  return (
    <div className={`${bg} border ${border} rounded-lg p-3 flex items-center gap-2`}>
      <span className="text-lg">{stijging <= 1 ? '⚠️' : '🔴'}</span>
      <div>
        <p className={`text-xs font-semibold ${titleKleur}`}>
          PEM toename: +{stijging} punten gemiddeld
        </p>
        <p className={`text-xs ${descKleur}`}>
          Dag zelf: ∅{t0gem} → max later: ∅{maxGem}
        </p>
      </div>
    </div>
  )
}

export default function EntryDetail({ entry, entries, onBewerken, onTerug }) {
  // Bereken het PEM patroon voor deze specifieke dag
  const allePatronen = entries ? berekenPEMpatronen(entries) : []
  const patroon = allePatronen.find(p => p.datum === entry.datum) || null

  const gem = gemSymptoomScore(entry.symptomen)

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
        <button onClick={() => onBewerken(entry)} className="btn-secondary text-sm py-1.5">
          Bewerken
        </button>
      </div>

      {/* PEM indicator */}
      <PEMIndicator patroon={patroon} />

      {/* Symptomen vandaag */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="section-title mb-0">
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Symptomen deze avond
          </h3>
          {gem !== null && (
            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${symptoomBgKleur(gem)}`}>∅ {gem}</span>
          )}
        </div>
        {entry.symptomen ? (
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(SYMPTOOM_LABELS).map(([k, naam]) => (
              <div key={k} className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-xs text-slate-500">{naam}</span>
                <span className={`text-sm font-bold ${symptoomKleur(entry.symptomen[k])}`}>
                  {entry.symptomen[k]}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">Geen symptomen ingevuld</p>
        )}
      </div>

      {/* PEM correlatie tabel */}
      <div className="card">
        <h3 className="section-title">
          <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          PEM patroon na deze dag
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Symptomen van de volgende dagen — automatisch gekoppeld aan activiteiten van deze dag.
        </p>
        <PEMKorrelatieTabel patroon={patroon} />
      </div>

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
        {!entry.activiteiten?.length ? (
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
                <span className="font-medium">{entry.extra.medicatie}</span>
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

      <button onClick={onTerug} className="btn-secondary w-full">Terug naar overzicht</button>
    </div>
  )
}
