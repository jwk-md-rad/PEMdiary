import { useState } from 'react'
import { useData } from '../contexts/DataContext.jsx'
import { berekenPEMpatronen } from '../utils/storage.js'
import {
  LineChart, Line, BarChart, Bar, ComposedChart, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine, ScatterChart, Scatter,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import { formatDatumKort, SYMPTOOM_LABELS, symptoomChartKleur, gemSymptoomScore, berekenBelasting } from '../utils/helpers.js'

const SYMPTOOM_KEYS = Object.keys(SYMPTOOM_LABELS)

function GrafiekKaart({ titel, beschrijving, children }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-slate-800 mb-0.5">{titel}</h3>
      {beschrijving && <p className="text-xs text-slate-400 mb-3">{beschrijving}</p>}
      {children}
    </div>
  )
}

function LegendeItem({ kleur, label }) {
  return (
    <span className="flex items-center gap-1 text-xs text-slate-500">
      <span className="w-3 h-0.5 rounded inline-block" style={{ backgroundColor: kleur }} />{label}
    </span>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {SYMPTOOM_LABELS[p.dataKey] || p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

function SymptoomTrendChart({ entries, geselecteerde }) {
  const data = entries.slice().reverse().map(e => {
    const row = { datum: formatDatumKort(e.datum) }
    SYMPTOOM_KEYS.forEach(k => { row[k] = e.symptomen?.[k] ?? null })
    return row
  })
  return (
    <GrafiekKaart titel="Symptoom trends per avond" beschrijving="Hoe je je elke avond voelt">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="datum" tick={{ fontSize: 9 }} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 9 }} />
          <Tooltip content={<CustomTooltip />} />
          {SYMPTOOM_KEYS.filter(k => geselecteerde.includes(k)).map(k => (
            <Line key={k} type="monotone" dataKey={k} stroke={symptoomChartKleur(k)}
              strokeWidth={2} dot={{ r: 3 }} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2 mt-2 justify-center">
        {SYMPTOOM_KEYS.map(k => <LegendeItem key={k} kleur={symptoomChartKleur(k)} label={SYMPTOOM_LABELS[k]} />)}
      </div>
    </GrafiekKaart>
  )
}

function PEMPatroonChart({ entries }) {
  const patronen = berekenPEMpatronen(entries)
  const tpLabels = { t0: 'Zelfde dag', t24: '+24u', t48: '+48u', t72: '+72u' }
  const data = Object.keys(tpLabels).map(tp => {
    const row = { tp: tpLabels[tp] }
    SYMPTOOM_KEYS.forEach(k => {
      const waarden = patronen.map(p => p[tp]?.[k]).filter(v => v != null)
      row[k] = waarden.length > 0 ? Math.round((waarden.reduce((a, b) => a + b, 0) / waarden.length) * 10) / 10 : null
    })
    return row
  })
  return (
    <GrafiekKaart titel="Gemiddeld PEM patroon" beschrijving="Hoe symptomen gemiddeld veranderen na een activiteitendag">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="tp" tick={{ fontSize: 10 }} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 9 }} />
          <Tooltip content={<CustomTooltip />} />
          {SYMPTOOM_KEYS.map(k => (
            <Line key={k} type="monotone" dataKey={k} stroke={symptoomChartKleur(k)}
              strokeWidth={2} dot={{ r: 4 }} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2 mt-2 justify-center">
        {SYMPTOOM_KEYS.map(k => <LegendeItem key={k} kleur={symptoomChartKleur(k)} label={SYMPTOOM_LABELS[k]} />)}
      </div>
    </GrafiekKaart>
  )
}

function BelastingChart({ entries }) {
  const data = entries.slice().reverse().map(e => ({
    datum: formatDatumKort(e.datum),
    belasting: Math.round(berekenBelasting(e.activiteiten)),
    symptomen: gemSymptoomScore(e.symptomen) ?? 0,
  }))
  return (
    <GrafiekKaart titel="Activiteitsbelasting vs symptomen" beschrijving="Belasting = minuten × RPE / 10">
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="datum" tick={{ fontSize: 9 }} />
          <YAxis yAxisId="links" tick={{ fontSize: 9 }} />
          <YAxis yAxisId="rechts" orientation="right" domain={[0, 10]} tick={{ fontSize: 9 }} />
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
            formatter={(val, name) => [val, name === 'belasting' ? 'Belasting' : 'Gem. symptoom']} />
          <Bar yAxisId="links" dataKey="belasting" fill="#3b82f6" opacity={0.8} radius={[3, 3, 0, 0]} name="belasting" />
          <Line yAxisId="rechts" type="monotone" dataKey="symptomen" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} name="symptomen" />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex gap-3 mt-2 justify-center">
        <LegendeItem kleur="#3b82f6" label="Belasting (balk)" />
        <LegendeItem kleur="#dc2626" label="Gem. symptoom (lijn)" />
      </div>
    </GrafiekKaart>
  )
}

function SlaapChart({ entries }) {
  const kwaliteitNummer = { slecht: 1, matig: 2, goed: 3 }
  const data = entries.slice().reverse().map(e => ({
    datum: formatDatumKort(e.datum),
    duur: e.nachtrust?.duur ? Number(e.nachtrust.duur) : null,
    kwaliteit: kwaliteitNummer[e.nachtrust?.kwaliteit] || null,
    hrv: e.nachtrust?.hrv ? Number(e.nachtrust.hrv) : null,
  }))
  return (
    <GrafiekKaart titel="Slaap trend" beschrijving="Slaapduur en kwaliteit (1=slecht, 2=matig, 3=goed)">
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="datum" tick={{ fontSize: 9 }} />
          <YAxis yAxisId="links" domain={[0, 12]} tick={{ fontSize: 9 }} />
          <YAxis yAxisId="rechts" orientation="right" domain={[0, 3]} tick={{ fontSize: 9 }} />
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
            formatter={(val, name) => name === 'kwaliteit'
              ? [{ 1: 'Slecht', 2: 'Matig', 3: 'Goed' }[val] || val, 'Kwaliteit']
              : [val, name === 'duur' ? 'Uren slaap' : 'HRV']} />
          <ReferenceLine yAxisId="links" y={8} stroke="#10b981" strokeDasharray="3 3" />
          <Line yAxisId="links" type="monotone" dataKey="duur" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} connectNulls name="duur" />
          <Line yAxisId="rechts" type="monotone" dataKey="kwaliteit" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} connectNulls name="kwaliteit" />
          {data.some(d => d.hrv) && (
            <Line yAxisId="links" type="monotone" dataKey="hrv" stroke="#10b981" strokeWidth={1.5} dot={false} connectNulls name="hrv" strokeDasharray="5 3" />
          )}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2 mt-2 justify-center">
        <LegendeItem kleur="#6366f1" label="Slaapduur (uur)" />
        <LegendeItem kleur="#f59e0b" label="Kwaliteit (1-3)" />
        <LegendeItem kleur="#10b981" label="HRV" />
      </div>
    </GrafiekKaart>
  )
}

function RadarProfielChart({ entries }) {
  const patronen = berekenPEMpatronen(entries)
  const data = SYMPTOOM_KEYS.map(k => {
    const row = { symptoom: SYMPTOOM_LABELS[k].split('/')[0].split(' ')[0] }
    ;['t0', 't24', 't72'].forEach(tp => {
      const waarden = patronen.map(p => p[tp]?.[k]).filter(v => v != null)
      row[tp] = waarden.length > 0 ? Math.round((waarden.reduce((a, b) => a + b, 0) / waarden.length) * 10) / 10 : 0
    })
    return row
  })
  return (
    <GrafiekKaart titel="Gemiddeld symptoom profiel" beschrijving="Vergelijking zelfde dag vs +24u vs +72u">
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid />
          <PolarAngleAxis dataKey="symptoom" tick={{ fontSize: 10 }} />
          <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 8 }} />
          <Radar name="Zelfde dag" dataKey="t0" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} />
          <Radar name="+24u" dataKey="t24" stroke="#dc2626" fill="#dc2626" fillOpacity={0.15} />
          <Radar name="+72u" dataKey="t72" stroke="#16a34a" fill="#16a34a" fillOpacity={0.1} />
        </RadarChart>
      </ResponsiveContainer>
      <div className="flex gap-3 mt-1 justify-center">
        <LegendeItem kleur="#2563eb" label="Zelfde dag" />
        <LegendeItem kleur="#dc2626" label="+24u" />
        <LegendeItem kleur="#16a34a" label="+72u" />
      </div>
    </GrafiekKaart>
  )
}

function CafeineAlcoholChart({ entries }) {
  const data = entries.slice().reverse().map(e => ({
    datum: formatDatumKort(e.datum),
    cafeine: e.extra?.cafeine || 0,
    alcohol: e.extra?.alcohol || 0,
    symptomen: gemSymptoomScore(e.symptomen) ?? 0,
  })).filter(d => d.cafeine > 0 || d.alcohol > 0 || d.symptomen > 0)

  if (data.length < 2) return null

  return (
    <GrafiekKaart titel="Cafeïne & alcohol vs symptomen" beschrijving="Relatie tussen gebruik en hoe je je voelt">
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="datum" tick={{ fontSize: 9 }} />
          <YAxis yAxisId="links" tick={{ fontSize: 9 }} />
          <YAxis yAxisId="rechts" orientation="right" domain={[0, 10]} tick={{ fontSize: 9 }} />
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
            formatter={(val, name) => [val, name === 'cafeine' ? 'Cafeïne (kopjes)' : name === 'alcohol' ? 'Alcohol (eenheden)' : 'Gem. symptoom']} />
          <Bar yAxisId="links" dataKey="cafeine" fill="#f59e0b" opacity={0.8} radius={[2, 2, 0, 0]} name="cafeine" />
          <Bar yAxisId="links" dataKey="alcohol" fill="#7c3aed" opacity={0.8} radius={[2, 2, 0, 0]} name="alcohol" />
          <Line yAxisId="rechts" type="monotone" dataKey="symptomen" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} name="symptomen" />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex gap-3 mt-1 justify-center">
        <LegendeItem kleur="#f59e0b" label="Cafeïne (kopjes)" />
        <LegendeItem kleur="#7c3aed" label="Alcohol (eenheden)" />
        <LegendeItem kleur="#dc2626" label="Gem. symptoom" />
      </div>
    </GrafiekKaart>
  )
}

export default function Grafieken() {
  const { entries } = useData()
  const [geselecteerdePeriode, setGeselecteerdePeriode] = useState(30)
  const [geselecteerdeSymptomen, setGeselecteerdeSymptomen] = useState(SYMPTOOM_KEYS)

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - geselecteerdePeriode)
  const gefilterd = entries.filter(e => new Date(e.datum) >= cutoff)

  function toggleSymptoom(k) {
    setGeselecteerdeSymptomen(prev => prev.includes(k) ? prev.filter(s => s !== k) : [...prev, k])
  }

  if (entries.length < 2) {
    return (
      <div className="p-4 text-center py-20 text-slate-400">
        <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm font-medium">Nog te weinig data voor grafieken</p>
        <p className="text-xs mt-1">Log minimaal 2 dagen om trends te zien</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700">Periode</h3>
          <div className="flex gap-1">
            {[7, 14, 30, 90].map(d => (
              <button key={d} onClick={() => setGeselecteerdePeriode(d)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  geselecteerdePeriode === d ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>{d}d</button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-2">Symptomen weergeven:</p>
          <div className="flex flex-wrap gap-1.5">
            {SYMPTOOM_KEYS.map(k => (
              <button key={k} onClick={() => toggleSymptoom(k)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors border ${
                  geselecteerdeSymptomen.includes(k) ? 'border-transparent text-white' : 'border-slate-300 text-slate-500 bg-white'
                }`}
                style={geselecteerdeSymptomen.includes(k) ? { backgroundColor: symptoomChartKleur(k) } : {}}>
                {SYMPTOOM_LABELS[k]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-right">{gefilterd.length} entries in geselecteerde periode</p>

      {gefilterd.length >= 2 ? (
        <>
          <SymptoomTrendChart entries={gefilterd} geselecteerde={geselecteerdeSymptomen} />
          <PEMPatroonChart entries={gefilterd} />
          <SlaapChart entries={gefilterd} />
          <BelastingChart entries={gefilterd} />
          <CafeineAlcoholChart entries={gefilterd} />
          {gefilterd.length >= 3 && <RadarProfielChart entries={gefilterd} />}
        </>
      ) : (
        <div className="text-center py-8 text-slate-400 text-sm">
          Niet genoeg data in de geselecteerde periode. Kies een langere periode.
        </div>
      )}
    </div>
  )
}
