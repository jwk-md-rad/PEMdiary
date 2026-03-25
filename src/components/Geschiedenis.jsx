import { useState, useEffect } from 'react'
import { getEntries, deleteEntry } from '../utils/storage.js'
import { formatDatum, formatDatumKort, symptoomBgKleur, gemSymptoomScore, SYMPTOOM_LABELS } from '../utils/helpers.js'

function EntryRij({ entry, onDetail, onBewerken, onVerwijder }) {
  const [bevestigVerwijder, setBevestigVerwijder] = useState(false)
  const t0 = entry.symptomen?.t0
  const gem = t0 ? gemSymptoomScore(t0) : null
  const totalDuur = entry.activiteiten?.reduce((sum, a) => sum + (Number(a.duur) || 0), 0) || 0

  return (
    <div className="card hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <button onClick={() => onDetail(entry)} className="text-left flex-1">
          <p className="text-sm font-semibold text-slate-900">{formatDatum(entry.datum)}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {entry.activiteiten?.length || 0} activiteit(en) · {totalDuur} min totaal
          </p>
        </button>
        {gem !== null && (
          <span className={`text-xs font-bold px-2 py-1 rounded-lg ml-2 flex-shrink-0 ${symptoomBgKleur(gem)}`}>
            ∅ {gem}
          </span>
        )}
      </div>

      {/* Symptomen tijdpunten */}
      {t0 && (
        <div className="grid grid-cols-5 gap-1 mb-3">
          {['t0', 't24', 't48', 't72'].map(tp => {
            const s = entry.symptomen[tp]
            const tpLabel = tp === 't0' ? 'Avond' : tp === 't24' ? '+24u' : tp === 't48' ? '+48u' : '+72u'
            const gem = s ? gemSymptoomScore(s) : null
            return (
              <div key={tp} className={`text-center p-1.5 rounded-lg ${s ? 'bg-slate-50' : 'bg-slate-50 opacity-40'}`}>
                <p className="text-xs text-slate-400">{tpLabel}</p>
                <p className={`text-sm font-bold ${s ? symptoomBgKleur(gem).split(' ')[1] : 'text-slate-300'}`}>
                  {gem !== null ? gem : '–'}
                </p>
              </div>
            )
          })}
          <div className="text-center p-1.5 rounded-lg bg-slate-50">
            <p className="text-xs text-slate-400">Slaap</p>
            <p className="text-sm font-bold text-slate-600">
              {entry.nachtrust?.duur ? `${entry.nachtrust.duur}u` : '–'}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onDetail(entry)}
          className="flex-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 py-1.5 rounded-lg font-medium transition-colors"
        >
          Bekijken
        </button>
        <button
          onClick={() => onBewerken(entry)}
          className="flex-1 text-xs text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 py-1.5 rounded-lg font-medium transition-colors"
        >
          Bewerken
        </button>
        {!bevestigVerwijder ? (
          <button
            onClick={() => setBevestigVerwijder(true)}
            className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            ✕
          </button>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={() => onVerwijder(entry.id)}
              className="text-xs text-red-600 bg-red-100 hover:bg-red-200 px-2 py-1.5 rounded-lg font-medium transition-colors"
            >
              Verwijder
            </button>
            <button
              onClick={() => setBevestigVerwijder(false)}
              className="text-xs text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-1.5 rounded-lg transition-colors"
            >
              Nee
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Geschiedenis({ onDetail, onBewerken }) {
  const [entries, setEntries] = useState([])
  const [zoek, setZoek] = useState('')

  useEffect(() => {
    setEntries(getEntries())
  }, [])

  function handleVerwijder(id) {
    deleteEntry(id)
    setEntries(getEntries())
  }

  const gefilterdeEntries = entries.filter(e => {
    if (!zoek) return true
    const q = zoek.toLowerCase()
    return (
      e.datum.includes(q) ||
      e.activiteiten?.some(a => a.activiteit?.toLowerCase().includes(q)) ||
      e.extra?.notities?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Zoek in je dagboek..."
            value={zoek}
            onChange={e => setZoek(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <span className="text-xs text-slate-400 flex-shrink-0">{gefilterdeEntries.length} entries</span>
      </div>

      {gefilterdeEntries.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-sm">{zoek ? 'Geen resultaten gevonden' : 'Geen entries'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {gefilterdeEntries.map(entry => (
            <EntryRij
              key={entry.id}
              entry={entry}
              onDetail={onDetail}
              onBewerken={onBewerken}
              onVerwijder={handleVerwijder}
            />
          ))}
        </div>
      )}
    </div>
  )
}
