import { useState, useCallback } from 'react'
import { useData } from '../contexts/DataContext.jsx'
import { formatDatumKort } from '../utils/helpers.js'

const DIENST_OPTIES = [
  { val: '',      label: 'Vrij'   },
  { val: 'dag',   label: 'Dag'    },
  { val: 'avond', label: 'Avond'  },
]

function clampScore(v) {
  const n = parseInt(v, 10)
  return isNaN(n) ? '' : Math.min(5, Math.max(1, n))
}

export default function BulkBewerken({ onSluiten }) {
  const { dagboek, saveEntry } = useData()

  // Local copy keyed by entry id — editable without waiting for context re-render
  const [lokaal, setLokaal] = useState(
    () => Object.fromEntries(dagboek.map(e => [e.id, { ...e, dienst: e.dienst || '' }]))
  )
  const [saved, setSaved] = useState({}) // id -> true (fades out)

  const setVeld = useCallback((id, key, value) => {
    setLokaal(prev => ({ ...prev, [id]: { ...prev[id], [key]: value } }))
  }, [])

  const bewaar = useCallback((id) => {
    saveEntry(lokaal[id])
    setSaved(prev => ({ ...prev, [id]: true }))
    setTimeout(() => setSaved(prev => ({ ...prev, [id]: false })), 1200)
  }, [lokaal, saveEntry])

  // Save on blur for text/number fields; immediate for select
  const onBlur = useCallback((id) => bewaar(id), [bewaar])

  const onDienstChange = useCallback((id, val) => {
    setLokaal(prev => ({ ...prev, [id]: { ...prev[id], dienst: val } }))
    // Save immediately after state update (use functional form to get latest)
    setLokaal(prev => {
      const updated = { ...prev[id], dienst: val }
      saveEntry(updated)
      setSaved(s => ({ ...s, [id]: true }))
      setTimeout(() => setSaved(s => ({ ...s, [id]: false })), 1200)
      return { ...prev, [id]: updated }
    })
  }, [saveEntry])

  const TH = ({ children, className = '' }) => (
    <th className={`px-2 py-2 text-xs font-semibold text-slate-600 bg-slate-50 border-b border-slate-200 whitespace-nowrap sticky top-0 ${className}`}>
      {children}
    </th>
  )

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Bulk bewerken</h2>
          <p className="text-xs text-slate-400">Wijzigingen opgeslagen zodra je een veld verlaat</p>
        </div>
        <button onClick={onSluiten} className="p-2 text-slate-400 hover:text-slate-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Scrollable table */}
      <div className="flex-1 overflow-auto">
        <table className="text-sm border-collapse w-full min-w-[580px]">
          <thead>
            <tr>
              <TH className="text-left pl-3 w-24">Datum</TH>
              <TH className="w-28">Dienst</TH>
              <TH className="w-16">Ortho</TH>
              <TH className="w-16">Energie</TH>
              <TH className="w-16">Slaap</TH>
              <TH className="w-20">HR</TH>
              <TH className="w-20">HRV</TH>
              <TH className="w-6"></TH>
            </tr>
          </thead>
          <tbody>
            {dagboek.map(entry => {
              const row = lokaal[entry.id]
              if (!row) return null
              const isSaved = saved[entry.id]

              return (
                <tr key={entry.id} className={`border-b border-slate-100 transition-colors ${isSaved ? 'bg-green-50' : 'hover:bg-slate-50'}`}>
                  {/* Datum */}
                  <td className="pl-3 py-1.5 text-xs text-slate-600 whitespace-nowrap">
                    {formatDatumKort(entry.datum)}
                  </td>

                  {/* Dienst */}
                  <td className="px-1 py-1">
                    <select
                      value={row.dienst}
                      onChange={e => onDienstChange(entry.id, e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-1.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                    >
                      {DIENST_OPTIES.map(o => (
                        <option key={o.val} value={o.val}>{o.label}</option>
                      ))}
                    </select>
                  </td>

                  {/* Score: Orthostatisch */}
                  <td className="px-1 py-1">
                    <input
                      type="number" min="1" max="5"
                      value={row.orthostatisch}
                      onChange={e => setVeld(entry.id, 'orthostatisch', e.target.value)}
                      onBlur={e => { setVeld(entry.id, 'orthostatisch', clampScore(e.target.value) || 3); onBlur(entry.id) }}
                      className="w-full text-center text-xs border border-slate-200 rounded-lg py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </td>

                  {/* Score: Energie */}
                  <td className="px-1 py-1">
                    <input
                      type="number" min="1" max="5"
                      value={row.energie}
                      onChange={e => setVeld(entry.id, 'energie', e.target.value)}
                      onBlur={e => { setVeld(entry.id, 'energie', clampScore(e.target.value) || 3); onBlur(entry.id) }}
                      className="w-full text-center text-xs border border-slate-200 rounded-lg py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </td>

                  {/* Score: Slaap */}
                  <td className="px-1 py-1">
                    <input
                      type="number" min="1" max="5"
                      value={row.slaap}
                      onChange={e => setVeld(entry.id, 'slaap', e.target.value)}
                      onBlur={e => { setVeld(entry.id, 'slaap', clampScore(e.target.value) || 3); onBlur(entry.id) }}
                      className="w-full text-center text-xs border border-slate-200 rounded-lg py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </td>

                  {/* Ochtend HR */}
                  <td className="px-1 py-1">
                    <input
                      type="number" min="30" max="220" placeholder="—"
                      value={row.ochtendHR}
                      onChange={e => setVeld(entry.id, 'ochtendHR', e.target.value)}
                      onBlur={() => onBlur(entry.id)}
                      className="w-full text-center text-xs border border-slate-200 rounded-lg py-1.5 focus:outline-none focus:ring-1 focus:ring-red-400 placeholder:text-slate-300"
                    />
                  </td>

                  {/* HRV */}
                  <td className="px-1 py-1">
                    <input
                      type="number" min="0" max="300" placeholder="—"
                      value={row.hrv}
                      onChange={e => setVeld(entry.id, 'hrv', e.target.value)}
                      onBlur={() => onBlur(entry.id)}
                      className="w-full text-center text-xs border border-slate-200 rounded-lg py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-400 placeholder:text-slate-300"
                    />
                  </td>

                  {/* Saved indicator */}
                  <td className="pr-2 text-center">
                    {isSaved && (
                      <span className="text-green-500 text-xs">✓</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-slate-100 px-4 py-3">
        <p className="text-xs text-slate-400 text-center">
          Ortho/Energie/Slaap: 1–5 &nbsp;·&nbsp; HR &amp; HRV in bpm/ms &nbsp;·&nbsp; ✓ = opgeslagen
        </p>
      </div>
    </div>
  )
}
