import { useState } from 'react'
import { useData } from '../contexts/DataContext.jsx'
import { formatDatum, formatDatumKort, vandaag, scoreKleurOrtho, scoreKleurPositief, dagelijkse_tip } from '../utils/helpers.js'
import { dagsSindsLaatsteTest } from '../utils/storage.js'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import DagboekForm from './DagboekForm.jsx'
import NASALeanTest from './NASALeanTest.jsx'

function ScoreDot({ score, type }) {
  const kleur = type === 'orthostatisch' ? scoreKleurOrtho(score) : scoreKleurPositief(score)
  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${kleur.bg} ${kleur.text}`}
    >
      {score}
    </span>
  )
}

function EntryKaart({ entry, onBewerken }) {
  const isVandaag = entry.datum === vandaag()
  return (
    <div className={`bg-white border rounded-xl p-4 space-y-3 ${isVandaag ? 'border-blue-300 shadow-sm' : 'border-slate-200'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-semibold ${isVandaag ? 'text-blue-700' : 'text-slate-800'}`}>
            {isVandaag ? 'Vandaag' : formatDatumKort(entry.datum)}
          </p>
          {entry.ochtendHR && (
            <p className="text-xs text-slate-400">HR {entry.ochtendHR} bpm{entry.hrv ? ` · HRV ${entry.hrv}` : ''}</p>
          )}
        </div>
        <button
          onClick={() => onBewerken(entry)}
          className="text-xs text-slate-400 hover:text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
        >
          Bewerken
        </button>
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col items-center gap-1 flex-1">
          <ScoreDot score={entry.orthostatisch} type="orthostatisch" />
          <span className="text-xs text-slate-500 text-center leading-tight">Ortho&shy;statisch</span>
        </div>
        <div className="flex flex-col items-center gap-1 flex-1">
          <ScoreDot score={entry.energie} type="energie" />
          <span className="text-xs text-slate-500 text-center">Energie</span>
        </div>
        <div className="flex flex-col items-center gap-1 flex-1">
          <ScoreDot score={entry.slaap} type="slaap" />
          <span className="text-xs text-slate-500 text-center">Slaap</span>
        </div>
      </div>

      {entry.notities ? (
        <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 leading-relaxed">{entry.notities}</p>
      ) : null}
    </div>
  )
}

function TestKaart({ test }) {
  const { verschil } = test
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm font-semibold text-slate-800">NASA Lean Test</p>
          <p className="text-xs text-slate-400">{formatDatumKort(test.datum)}</p>
        </div>
        {verschil !== null && (
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${
            verschil >= 30 ? 'bg-red-100 text-red-700' :
            verschil >= 20 ? 'bg-orange-100 text-orange-700' :
            'bg-green-100 text-green-700'
          }`}>
            +{verschil} bpm
          </span>
        )}
      </div>
      <div className="flex gap-4 text-xs text-slate-500">
        {test.hrBaseline && <span>Liggend: <strong>{test.hrBaseline}</strong></span>}
        {test.hrMaxStaand && <span>Max: <strong>{test.hrMaxStaand}</strong></span>}
        {test.hrNaLiggen && <span>Herstel: <strong>{test.hrNaLiggen}</strong></span>}
      </div>
    </div>
  )
}

function TrendGrafiek({ dagboek }) {
  if (dagboek.length < 2) return null
  const data = dagboek.slice(0, 14).reverse().map(e => ({
    datum: formatDatumKort(e.datum),
    ortho: e.orthostatisch,
    energie: e.energie,
    slaap: e.slaap,
  }))

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-sm font-semibold text-slate-800 mb-3">Trend — laatste {data.length} dagen</p>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 2, right: 4, bottom: 0, left: -24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="datum" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
          <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 9 }} />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
            formatter={(val, name) => [val, name === 'ortho' ? 'Orthostatisch' : name === 'energie' ? 'Energie' : 'Slaap']}
          />
          <Line type="monotone" dataKey="ortho"   stroke="#ef4444" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="energie" stroke="#16a34a" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="slaap"   stroke="#2563eb" strokeWidth={2} dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 justify-center">
        {[['#ef4444', 'Orthostatisch'], ['#16a34a', 'Energie'], ['#2563eb', 'Slaap']].map(([k, l]) => (
          <span key={l} className="flex items-center gap-1 text-xs text-slate-400">
            <span className="w-3 h-0.5 rounded inline-block" style={{ backgroundColor: k }} />{l}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function DagboekTab() {
  const { dagboek, tests } = useData()
  const [toonForm, setToonForm] = useState(false)
  const [toonTest, setToonTest] = useState(false)
  const [bewerkEntry, setBewerkEntry] = useState(null)

  const today = vandaag()
  const heeftVandaag = dagboek.some(e => e.datum === today)
  const dagenSindsTest = dagsSindsLaatsteTest(tests)
  const tip = dagelijkse_tip()

  function naarBewerken(entry) {
    setBewerkEntry(entry)
    setToonForm(true)
  }

  function sluitForm() {
    setToonForm(false)
    setBewerkEntry(null)
  }

  return (
    <div className="px-4 pt-4 pb-28 space-y-4">
      {/* Dagelijkse tip banner */}
      <div className="bg-blue-600 rounded-xl p-4 text-white">
        <p className="text-xs text-blue-200 font-medium mb-0.5">Denk vandaag aan</p>
        <p className="text-sm font-semibold">{tip.titel}</p>
        <p className="text-xs text-blue-100 mt-1 leading-relaxed">{tip.tekst}</p>
      </div>

      {/* Log vandaag knop */}
      {!heeftVandaag ? (
        <button
          onClick={() => { setBewerkEntry(null); setToonForm(true) }}
          className="w-full btn-primary py-4 text-base font-semibold flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Vandaag loggen
        </button>
      ) : (
        <button
          onClick={() => { setBewerkEntry(null); setToonForm(true) }}
          className="w-full btn-secondary py-3 text-sm"
        >
          + Extra entry toevoegen
        </button>
      )}

      {/* NASA Lean Test reminder */}
      {dagenSindsTest >= 7 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {dagenSindsTest === Infinity ? 'Nog geen NASA Lean Test gedaan' : `${dagenSindsTest} dagen geleden getest`}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Wekelijkse stand-test: 10 min supine · 10 min staan · nuchter
            </p>
            <button
              onClick={() => setToonTest(true)}
              className="mt-2 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              Test nu registreren
            </button>
          </div>
        </div>
      )}

      {/* Trendgrafiek */}
      <TrendGrafiek dagboek={dagboek} />

      {/* Recente test */}
      {tests.length > 0 && dagenSindsTest < 7 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-700">Laatste stand-test</p>
            <button onClick={() => setToonTest(true)} className="text-xs text-blue-600 hover:underline">
              Nieuwe test
            </button>
          </div>
          <TestKaart test={tests[0]} />
        </div>
      )}

      {/* Dagboek entries */}
      {dagboek.length > 0 ? (
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">Recente entries</p>
          <div className="space-y-3">
            {dagboek.slice(0, 14).map(entry => (
              <EntryKaart key={entry.id} entry={entry} onBewerken={naarBewerken} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-slate-400">
          <svg className="w-10 h-10 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">Nog geen entries</p>
          <p className="text-xs mt-1">Tik op 'Vandaag loggen' om te beginnen</p>
        </div>
      )}

      {/* Modals */}
      {toonForm && (
        <DagboekForm
          entry={bewerkEntry}
          onOpgeslagen={sluitForm}
          onAnnuleren={sluitForm}
        />
      )}
      {toonTest && (
        <NASALeanTest
          test={null}
          onOpgeslagen={() => setToonTest(false)}
          onAnnuleren={() => setToonTest(false)}
        />
      )}
    </div>
  )
}
