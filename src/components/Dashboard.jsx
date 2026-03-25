import { useState, useEffect } from 'react'
import { getEntries, getFollowUpEntries } from '../utils/storage.js'
import { formatDatum, formatDatumKort, symptoomBgKleur, gemSymptoomScore, SYMPTOOM_LABELS, vandaag } from '../utils/helpers.js'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function SymptoomBadge({ waarde, label }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${symptoomBgKleur(waarde)}`}>
      {label}: {waarde}
    </span>
  )
}

function MiniTrendChart({ entries }) {
  if (entries.length < 2) return null

  const data = entries.slice(0, 14).reverse().map(e => ({
    datum: formatDatumKort(e.datum),
    vermoeidheid: e.symptomen?.t0?.vermoeidheid ?? null,
    brainFog: e.symptomen?.t0?.brainFog ?? null,
    pijn: e.symptomen?.t0?.pijn ?? null,
  }))

  return (
    <div className="card">
      <h3 className="section-title text-sm mb-2">
        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Symptomen – laatste 14 dagen (avond t=0)
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

function FollowUpKaart({ followUp, onBewerken }) {
  const { entry, label } = followUp
  return (
    <div className="border border-orange-200 bg-orange-50 rounded-xl p-3 flex items-center gap-3">
      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-orange-700">{formatDatumKort(entry.datum)} – symptomen {label}</p>
        <p className="text-xs text-orange-600 truncate">{entry.activiteiten.length} activiteit(en)</p>
      </div>
      <button
        onClick={() => onBewerken(entry, followUp)}
        className="text-xs bg-orange-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-orange-600 flex-shrink-0"
      >
        Invullen
      </button>
    </div>
  )
}

function RecenteEntryKaart({ entry, onDetail }) {
  const t0 = entry.symptomen?.t0
  const gem = t0 ? gemSymptoomScore(t0) : null
  const heeftActiviteiten = entry.activiteiten?.length > 0

  return (
    <button
      onClick={() => onDetail(entry)}
      className="card w-full text-left hover:border-blue-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">{formatDatumKort(entry.datum)}</p>
          <p className="text-xs text-slate-400">{heeftActiviteiten ? `${entry.activiteiten.length} activiteit(en)` : 'Geen activiteiten'}</p>
        </div>
        {gem !== null && (
          <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${symptoomBgKleur(gem)}`}>
            ∅ {gem}
          </span>
        )}
      </div>

      {t0 && (
        <div className="flex flex-wrap gap-1">
          <SymptoomBadge waarde={t0.vermoeidheid} label="Moe" />
          <SymptoomBadge waarde={t0.brainFog} label="Fog" />
          <SymptoomBadge waarde={t0.pijn} label="Pijn" />
          {entry.symptomen.t24 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">+24u ✓</span>
          )}
          {entry.symptomen.t48 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">+48u ✓</span>
          )}
          {entry.symptomen.t72 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">+72u ✓</span>
          )}
        </div>
      )}

      {entry.nachtrust?.kwaliteit && (
        <p className="text-xs text-slate-400 mt-1">
          Slaap: {entry.nachtrust.duur ? `${entry.nachtrust.duur}u` : '?'} ({entry.nachtrust.kwaliteit})
        </p>
      )}
    </button>
  )
}

export default function Dashboard({ onNieuw, onBewerken, onDetail }) {
  const [entries, setEntries] = useState([])
  const [followUps, setFollowUps] = useState([])
  const today = vandaag()

  useEffect(() => {
    setEntries(getEntries())
    setFollowUps(getFollowUpEntries())
  }, [])

  const heeftVandaag = entries.some(e => e.datum === today)
  const recenteEntries = entries.slice(0, 7)

  return (
    <div className="p-4 space-y-4">
      {/* Vandaag */}
      <div className="card bg-gradient-to-br from-blue-600 to-blue-700 border-0 text-white">
        <p className="text-blue-100 text-xs mb-1">{formatDatum(today)}</p>
        <h2 className="text-lg font-bold mb-3">
          {heeftVandaag ? 'Dag al gelogd' : 'Goede dag vandaag!'}
        </h2>
        <button
          onClick={onNieuw}
          className="bg-white text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors w-full"
        >
          {heeftVandaag ? '+ Extra entry toevoegen' : '+ Nieuwe dag loggen'}
        </button>
      </div>

      {/* Follow-up herinneringen */}
      {followUps.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-400 rounded-full" />
            Nog in te vullen ({followUps.length})
          </h3>
          <div className="space-y-2">
            {followUps.map((fu, i) => (
              <FollowUpKaart key={i} followUp={fu} onBewerken={onBewerken} />
            ))}
          </div>
        </div>
      )}

      {/* Mini trend chart */}
      {entries.length >= 2 && <MiniTrendChart entries={entries} />}

      {/* Recente entries */}
      {recenteEntries.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Recente dagen</h3>
          <div className="space-y-2">
            {recenteEntries.map(entry => (
              <RecenteEntryKaart key={entry.id} entry={entry} onDetail={onDetail} />
            ))}
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
