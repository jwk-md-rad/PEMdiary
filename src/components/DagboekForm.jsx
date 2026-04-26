import { useState } from 'react'
import { useData } from '../contexts/DataContext.jsx'
import { createLeegEntry, vandaag } from '../utils/storage.js'
import { scoreKleurOrtho, scoreKleurPositief } from '../utils/helpers.js'

const SCORES = [1, 2, 3, 4, 5]

function ScoreKnop({ waarde, geselecteerd, kleur, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(waarde)}
      style={geselecteerd ? { backgroundColor: kleur, borderColor: kleur, color: 'white' } : { borderColor: kleur }}
      className={`w-12 h-12 rounded-full border-2 font-bold text-base transition-all flex-shrink-0 ${
        geselecteerd ? 'shadow-md scale-110' : 'bg-white text-slate-600'
      }`}
    >
      {waarde}
    </button>
  )
}

function ScoreVeld({ label, sublabel, waarde, onChange, kleuren }) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <label className="text-sm font-semibold text-slate-800">{label}</label>
        <span className="text-xs text-slate-400">{sublabel}</span>
      </div>
      <div className="flex gap-2 justify-between">
        {SCORES.map(n => (
          <ScoreKnop
            key={n}
            waarde={n}
            geselecteerd={waarde === n}
            kleur={kleuren[n]}
            onClick={onChange}
          />
        ))}
      </div>
    </div>
  )
}

const ORTHO_HEX = { 1: '#16a34a', 2: '#84cc16', 3: '#eab308', 4: '#f97316', 5: '#ef4444' }
const POS_HEX   = { 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#84cc16', 5: '#16a34a' }

export default function DagboekForm({ entry, onOpgeslagen, onAnnuleren }) {
  const { saveEntry } = useData()
  const [formData, setFormData] = useState(() =>
    entry ? JSON.parse(JSON.stringify(entry)) : createLeegEntry(vandaag())
  )
  const [opgeslagen, setOpgeslagen] = useState(false)

  const set = (key, value) => setFormData(prev => ({ ...prev, [key]: value }))

  function handleOpslaan(e) {
    e.preventDefault()
    saveEntry(formData)
    setOpgeslagen(true)
    setTimeout(onOpgeslagen, 600)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-end justify-center" onClick={onAnnuleren}>
      <div
        className="bg-white w-full max-w-lg rounded-t-2xl p-5 pb-safe space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {entry ? 'Entry bijwerken' : 'Dag loggen'}
          </h2>
          <button onClick={onAnnuleren} className="p-2 text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleOpslaan} className="space-y-5">
          {/* Datum */}
          <div>
            <label className="label">Datum</label>
            <input type="date" value={formData.datum} required
              onChange={e => set('datum', e.target.value)}
              className="input-field" />
          </div>

          {/* Scores */}
          <div className="space-y-5 bg-slate-50 rounded-xl p-4">
            <ScoreVeld
              label="Orthostatische klachten"
              sublabel="1 = geen  ·  5 = ernstig"
              waarde={formData.orthostatisch}
              onChange={v => set('orthostatisch', v)}
              kleuren={ORTHO_HEX}
            />
            <div className="border-t border-slate-200" />
            <ScoreVeld
              label="Energieniveau"
              sublabel="1 = uitgeput  ·  5 = goed"
              waarde={formData.energie}
              onChange={v => set('energie', v)}
              kleuren={POS_HEX}
            />
            <div className="border-t border-slate-200" />
            <ScoreVeld
              label="Slaapkwaliteit"
              sublabel="1 = slecht  ·  5 = goed"
              waarde={formData.slaap}
              onChange={v => set('slaap', v)}
              kleuren={POS_HEX}
            />
          </div>

          {/* Dienst */}
          <div>
            <label className="label">Dienst</label>
            <div className="flex gap-2">
              {[['', 'Vrij'], ['dag', 'Dagdienst'], ['avond', 'Avonddienst']].map(([val, label]) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => set('dienst', val)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                    (formData.dienst || '') === val
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* HR & HRV */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Ochtend-HR (bpm)</label>
              <input type="number" min="30" max="200" placeholder="bijv. 62"
                value={formData.ochtendHR}
                onChange={e => set('ochtendHR', e.target.value)}
                className="input-field" />
            </div>
            <div>
              <label className="label">HRV / RMSSD</label>
              <input type="number" min="0" max="200" placeholder="bijv. 42"
                value={formData.hrv}
                onChange={e => set('hrv', e.target.value)}
                className="input-field" />
            </div>
          </div>

          {/* Notities */}
          <div>
            <label className="label">Notities</label>
            <textarea
              rows={3}
              placeholder="Triggers, bijzonderheden, medicatie..."
              value={formData.notities}
              onChange={e => set('notities', e.target.value)}
              className="input-field resize-none"
            />
          </div>

          {/* Opslaan */}
          <button type="submit"
            className={`btn-primary w-full py-3 text-base ${opgeslagen ? 'bg-green-600 hover:bg-green-600' : ''}`}>
            {opgeslagen ? '✓ Opgeslagen!' : 'Opslaan'}
          </button>
        </form>
      </div>
    </div>
  )
}
