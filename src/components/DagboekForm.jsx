import { useState } from 'react'
import { saveEntry, createLeegEntry } from '../utils/storage.js'
import { SYMPTOOM_LABELS, vandaag } from '../utils/helpers.js'

function SymptomenBlok({ waarden, onChange }) {
  return (
    <div className="space-y-4">
      {Object.entries(SYMPTOOM_LABELS).map(([key, naam]) => (
        <div key={key}>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-slate-600">{naam}</label>
            <span className={`text-sm font-bold w-6 text-right ${
              waarden[key] <= 2 ? 'text-green-600' :
              waarden[key] <= 4 ? 'text-yellow-600' :
              waarden[key] <= 6 ? 'text-orange-500' : 'text-red-600'
            }`}>{waarden[key]}</span>
          </div>
          <input
            type="range" min="0" max="10" step="1"
            value={waarden[key]}
            onChange={e => onChange({ ...waarden, [key]: Number(e.target.value) })}
            className="slider-symptoom"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-0.5">
            <span>0 Geen</span>
            <span>10 Ernstig</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function ActiviteitRij({ activiteit, index, onChange, onVerwijder }) {
  return (
    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-slate-500">Activiteit {index + 1}</span>
        <button type="button" onClick={onVerwijder} className="text-red-400 hover:text-red-600 text-xs">
          Verwijder
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">Tijd</label>
          <input type="time" value={activiteit.tijd}
            onChange={e => onChange({ ...activiteit, tijd: e.target.value })}
            className="input-field" />
        </div>
        <div>
          <label className="label">Type</label>
          <select value={activiteit.type}
            onChange={e => onChange({ ...activiteit, type: e.target.value })}
            className="input-field">
            <option value="fysiek">Fysiek</option>
            <option value="mentaal">Mentaal</option>
            <option value="sociaal">Sociaal</option>
          </select>
        </div>
      </div>

      <div className="mt-2">
        <label className="label">Activiteit</label>
        <input type="text" placeholder="Bijv. wandelen, e-mails lezen..."
          value={activiteit.activiteit}
          onChange={e => onChange({ ...activiteit, activiteit: e.target.value })}
          className="input-field" />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2">
        <div>
          <label className="label">Duur (min)</label>
          <input type="number" min="0" placeholder="0" value={activiteit.duur}
            onChange={e => onChange({ ...activiteit, duur: e.target.value })}
            className="input-field" />
        </div>
        <div>
          <label className="label">Gem. HR</label>
          <input type="number" min="0" placeholder="—" value={activiteit.gemHR}
            onChange={e => onChange({ ...activiteit, gemHR: e.target.value })}
            className="input-field" />
        </div>
        <div>
          <label className="label">Max HR</label>
          <input type="number" min="0" placeholder="—" value={activiteit.maxHR}
            onChange={e => onChange({ ...activiteit, maxHR: e.target.value })}
            className="input-field" />
        </div>
      </div>

      <div className="mt-2">
        <div className="flex justify-between items-center mb-1">
          <label className="label mb-0">RPE (inspanningsperceptie)</label>
          <span className={`text-sm font-bold ${
            activiteit.rpe <= 3 ? 'text-green-600' :
            activiteit.rpe <= 6 ? 'text-yellow-600' : 'text-red-600'
          }`}>{activiteit.rpe}/10</span>
        </div>
        <input type="range" min="0" max="10" step="1" value={activiteit.rpe}
          onChange={e => onChange({ ...activiteit, rpe: Number(e.target.value) })}
          className="slider-rpe" />
        <div className="flex justify-between text-xs text-slate-400 mt-0.5">
          <span>0 Rust</span><span>5 Matig</span><span>10 Maximaal</span>
        </div>
      </div>

      <div className="mt-2">
        <label className="label">Opmerkingen</label>
        <input type="text" placeholder="Bijv. orthostase, triggers..."
          value={activiteit.opmerkingen}
          onChange={e => onChange({ ...activiteit, opmerkingen: e.target.value })}
          className="input-field" />
      </div>
    </div>
  )
}

function nieuweActiviteit() {
  return {
    id: `act_${Date.now()}`,
    tijd: '', type: 'fysiek', activiteit: '',
    duur: '', rpe: 3, gemHR: '', maxHR: '', opmerkingen: '',
  }
}

export default function DagboekForm({ entry, onOpgeslagen, onAnnuleren }) {
  const [formData, setFormData] = useState(() =>
    entry ? JSON.parse(JSON.stringify(entry)) : createLeegEntry(vandaag())
  )
  const [activeTab, setActiveTab] = useState('activiteiten')
  const [opgeslagen, setOpgeslagen] = useState(false)

  function updateNachtrust(field, value) {
    setFormData(prev => ({ ...prev, nachtrust: { ...prev.nachtrust, [field]: value } }))
  }

  function updateExtra(field, value) {
    setFormData(prev => ({ ...prev, extra: { ...prev.extra, [field]: value } }))
  }

  function updateSymptomen(waarden) {
    setFormData(prev => ({ ...prev, symptomen: waarden }))
  }

  function voegActiviteitToe() {
    setFormData(prev => ({ ...prev, activiteiten: [...prev.activiteiten, nieuweActiviteit()] }))
  }

  function updateActiviteit(index, updated) {
    setFormData(prev => {
      const activiteiten = [...prev.activiteiten]
      activiteiten[index] = updated
      return { ...prev, activiteiten }
    })
  }

  function verwijderActiviteit(index) {
    setFormData(prev => ({ ...prev, activiteiten: prev.activiteiten.filter((_, i) => i !== index) }))
  }

  function handleOpslaan(e) {
    e.preventDefault()
    saveEntry(formData)
    setOpgeslagen(true)
    setTimeout(() => onOpgeslagen(), 800)
  }

  const tabs = [
    { id: 'activiteiten', label: 'Activiteiten & Slaap' },
    { id: 'symptomen', label: 'Symptomen vanavond' },
    { id: 'extra', label: 'Extra' },
  ]

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">
          {entry ? 'Dag bijwerken' : 'Nieuwe dag'}
        </h2>
        <button onClick={onAnnuleren} className="text-slate-400 hover:text-slate-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleOpslaan} className="space-y-4">
        {/* Datum */}
        <div className="card">
          <label className="label">Datum</label>
          <input type="date" value={formData.datum} required
            onChange={e => setFormData(prev => ({ ...prev, datum: e.target.value }))}
            className="input-field" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {tabs.map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Activiteiten & Slaap */}
        {activeTab === 'activiteiten' && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="section-title">
                <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                Nachtrust
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Slaapduur (uur)</label>
                  <input type="number" min="0" max="24" step="0.5" placeholder="7.5"
                    value={formData.nachtrust.duur}
                    onChange={e => updateNachtrust('duur', e.target.value)}
                    className="input-field" />
                </div>
                <div>
                  <label className="label">Kwaliteit</label>
                  <select value={formData.nachtrust.kwaliteit}
                    onChange={e => updateNachtrust('kwaliteit', e.target.value)}
                    className="input-field">
                    <option value="slecht">Slecht</option>
                    <option value="matig">Matig</option>
                    <option value="goed">Goed</option>
                  </select>
                </div>
                <div>
                  <label className="label">Nacht-HR (gem.)</label>
                  <input type="number" min="0" placeholder="—" value={formData.nachtrust.nachtHR}
                    onChange={e => updateNachtrust('nachtHR', e.target.value)}
                    className="input-field" />
                </div>
                <div>
                  <label className="label">HRV (Garmin)</label>
                  <input type="number" min="0" placeholder="—" value={formData.nachtrust.hrv}
                    onChange={e => updateNachtrust('hrv', e.target.value)}
                    className="input-field" />
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="section-title">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Activiteiten
              </h3>
              <div className="space-y-3">
                {formData.activiteiten.map((act, i) => (
                  <ActiviteitRij key={act.id} activiteit={act} index={i}
                    onChange={updated => updateActiviteit(i, updated)}
                    onVerwijder={() => verwijderActiviteit(i)} />
                ))}
              </div>
              <button type="button" onClick={voegActiviteitToe}
                className="mt-3 w-full border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 rounded-lg py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Activiteit toevoegen
              </button>
            </div>
          </div>
        )}

        {/* Symptomen vanavond */}
        {activeTab === 'symptomen' && (
          <div className="card">
            <h3 className="section-title">
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Hoe voel je je vanavond?
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              De app koppelt deze scores automatisch als +24u/+48u/+72u aan activiteiten van de vorige dagen.
            </p>
            <SymptomenBlok
              waarden={formData.symptomen}
              onChange={updateSymptomen}
            />
          </div>
        )}

        {/* Extra */}
        {activeTab === 'extra' && (
          <div className="card space-y-4">
            <h3 className="section-title">
              <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Extra gegevens
            </h3>
            <div>
              <label className="label">Rust-HR ochtend (bpm)</label>
              <input type="number" min="0" placeholder="—" value={formData.extra.rustHROchtend}
                onChange={e => updateExtra('rustHROchtend', e.target.value)}
                className="input-field" />
            </div>
            <div>
              <label className="label">Medicatie / supplementen</label>
              <input type="text" placeholder="Bijv. LDN 4.5mg, magnesium..."
                value={formData.extra.medicatie}
                onChange={e => updateExtra('medicatie', e.target.value)}
                className="input-field" />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.extra.cafeine}
                  onChange={e => updateExtra('cafeine', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600" />
                <span className="text-sm text-slate-700">Cafeïne</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.extra.alcohol}
                  onChange={e => updateExtra('alcohol', e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600" />
                <span className="text-sm text-slate-700">Alcohol</span>
              </label>
            </div>
            <div>
              <label className="label">Notities</label>
              <textarea rows={4} placeholder="Vrije notities, triggers, bijzonderheden..."
                value={formData.extra.notities}
                onChange={e => updateExtra('notities', e.target.value)}
                className="input-field resize-none" />
            </div>
          </div>
        )}

        <div className="flex gap-3 pb-4">
          <button type="button" onClick={onAnnuleren} className="btn-secondary flex-1">
            Annuleren
          </button>
          <button type="submit"
            className={`btn-primary flex-1 ${opgeslagen ? 'bg-green-600 hover:bg-green-600' : ''}`}>
            {opgeslagen ? '✓ Opgeslagen!' : 'Opslaan'}
          </button>
        </div>
      </form>
    </div>
  )
}
