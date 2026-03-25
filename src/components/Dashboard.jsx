import { useState, useEffect } from 'react'
import { getEntries, berekenPEMpatronen } from '../utils/storage.js'
import { formatDatum, formatDatumKort, symptoomBgKleur, gemSymptoomScore, SYMPTOOM_LABELS, vandaag, maxPEMStijging } from '../utils/helpers.js'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function MiniTrendChart({ entries }) {
  if (entries.length < 2) return null

  const data = entries.slice(0, 14).reverse().map(e => ({
    datum: formatDatumKort(e.datum),
    vermoeidheid: e.symptomen?.vermoeidheid ?? null,
    brainFog: e.symptomen?.brainFog ?? null,
    pijn: e.symptomen?.pijn ?? null,
  }))

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Symptomen – laatste 14 dagen
      </h3>
      <ResponsiveContainer width="100%" height={130}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="datum" tick={{ fontSize: 9 }} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 9 }} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
            formatter={(val, name) => [val, SYMPTOOM_LABELS[name] || name]}
          />
          <Line type="monotone" dataKey="vermoeidheid" stroke="#2563eb" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="brainFog" stroke="#7c3aed" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="pijn" stroke="#dc2626" strokeWidth={2} dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-3 mt-1 justify-center">
        {[['#2563eb', 'Vermoeidheid'], ['#7c3aed', 'Brain fog'], ['#dc2626', 'Pijn']].map(([kleur, label]) => (
          <span key={label} className="flex items-center gap-1 text-xs text-slate-500">
            <span className="w-3 h-0.5 rounded inline-block" style={{ backgroundColor: kleur }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

function RecenteEntryKaart({ entry, patroon, onDetail }) {
  const gem = gemSymptoomScore(entry.symptomen)
  const pemStijging = patroon ? maxPEMStijging(patroon) : null

  return (
    <button onClick={() => onDetail(entry)}
      className="card w-full text-left hover:border-blue-300 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">{formatDatumKort(entry.datum)}</p>
          <p className="text-xs text-slate-400">
            {entry.activiteiten?.length
              ? `${entry.activiteiten.length} activiteit(en)`
              : 'Geen activiteiten'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pemStijging !== null && pemStijging > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              pemStijging <= 1 ? 'bg-yellow-100 text-yellow-700' :
              pemStijging <= 2 ? 'bg-orange-100 text-orange-700' :
              'bg-red-100 text-red-700'
            }`}>
              PEM +{pemStijging}
            </span>
          )}
          {gem !== null && (
            <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${symptoomBgKleur(gem)}`}>
              ∅ {gem}
            </span>
          )}
        </div>
      </div>

      {entry.symptomen && (
        <div className="flex gap-2 text-xs text-slate-500">
          <span>Moe: <strong className={gem <= 2 ? 'text-green-600' : gem <= 4 ? 'text-yellow-600' : 'text-red-600'}>{entry.symptomen.vermoeidheid}</strong></span>
          <span>Fog: <strong>{entry.symptomen.brainFog}</strong></span>
          <span>Pijn: <strong>{entry.symptomen.pijn}</strong></span>
          {entry.nachtrust?.duur && (
            <span className="ml-auto">Slaap: {entry.nachtrust.duur}u</span>
          )}
        </div>
      )}
    </button>
  )
}

export default function Dashboard({ onNieuw, onBewerken, onDetail }) {
  const [entries, setEntries] = useState([])
  const [patronen, setPatronen] = useState([])
  const today = vandaag()

  useEffect(() => {
    const e = getEntries()
    setEntries(e)
    setPatronen(berekenPEMpatronen(e))
  }, [])

  const heeftVandaag = entries.some(e => e.datum === today)
  const recenteEntries = entries.slice(0, 7)

  return (
    <div className="p-4 space-y-4">
      {/* Vandaag */}
      <div className="card bg-gradient-to-br from-blue-600 to-blue-700 border-0 text-white">
        <p className="text-blue-100 text-xs mb-1">{formatDatum(today)}</p>
        <h2 className="text-lg font-bold mb-3">
          {heeftVandaag ? 'Dag al gelogd' : 'Goede dag!'}
        </h2>
        <button onClick={onNieuw}
          className="bg-white text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors w-full">
          {heeftVandaag ? '+ Extra entry toevoegen' : '+ Nieuwe dag loggen'}
        </button>
      </div>

      {/* Mini trend chart */}
      {entries.length >= 2 && <MiniTrendChart entries={entries} />}

      {/* Recente entries */}
      {recenteEntries.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Recente dagen</h3>
          <div className="space-y-2">
            {recenteEntries.map(entry => {
              const patroon = patronen.find(p => p.datum === entry.datum)
              return (
                <RecenteEntryKaart key={entry.id} entry={entry} patroon={patroon} onDetail={onDetail} />
              )
            })}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm font-medium">Nog geen entries</p>
          <p className="text-xs mt-1">Begin met je eerste dag te loggen!</p>
        </div>
      )}
    </div>
  )
}
