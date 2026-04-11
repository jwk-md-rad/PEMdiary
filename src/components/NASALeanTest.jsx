import { useState } from 'react'
import { useData } from '../contexts/DataContext.jsx'
import { createLeegTest, vandaag } from '../utils/storage.js'
import { loadSettings } from '../utils/crypto.js'

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const b64 = reader.result.split(',')[1]
      resolve(b64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function analyserenMetClaude(base64, mediaType, apiKey) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      'anthropic-dangerous-allow-browser': 'true',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: `Dit is een Garmin hartslag grafiek van een NASA Lean Test. Het protocol: ~1 minuut liggen (baseline), ~10 minuten staan, ~1 minuut terugliggen.

Geef ALLEEN een JSON object terug zonder uitleg:
{
  "hrBaseline": <gemiddelde HR tijdens de eerste minuut liggen, als geheel getal>,
  "hrMaxStaand": <maximale HR tijdens de staand-fase, als geheel getal>,
  "hrNaLiggen": <gemiddelde HR tijdens de terugliggende fase, als geheel getal>
}

Als een waarde niet duidelijk leesbaar is, gebruik dan null.`,
          },
        ],
      }],
    }),
  })

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(err.error?.message || `HTTP ${resp.status}`)
  }

  const data = await resp.json()
  const tekst = data.content?.[0]?.text || ''
  const match = tekst.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Geen JSON gevonden in antwoord')
  return JSON.parse(match[0])
}

export default function NASALeanTest({ test, onOpgeslagen, onAnnuleren }) {
  const { saveTest } = useData()
  const [formData, setFormData] = useState(() =>
    test ? JSON.parse(JSON.stringify(test)) : createLeegTest(vandaag())
  )
  const [uploaden, setUploaden] = useState(false)
  const [uploadFout, setUploadFout] = useState('')
  const [opgeslagen, setOpgeslagen] = useState(false)

  const set = (key, value) => setFormData(prev => ({ ...prev, [key]: value }))

  async function handleScreenshot(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const settings = loadSettings()
    if (!settings.claudeApiKey) {
      setUploadFout('Vul eerst je Claude API-sleutel in bij Instellingen.')
      return
    }

    setUploaden(true)
    setUploadFout('')
    try {
      const base64 = await fileToBase64(file)
      const mediaType = file.type || 'image/jpeg'
      const waarden = await analyserenMetClaude(base64, mediaType, settings.claudeApiKey)
      setFormData(prev => ({
        ...prev,
        hrBaseline: waarden.hrBaseline ?? prev.hrBaseline,
        hrMaxStaand: waarden.hrMaxStaand ?? prev.hrMaxStaand,
        hrNaLiggen: waarden.hrNaLiggen ?? prev.hrNaLiggen,
      }))
    } catch (err) {
      setUploadFout(`Fout bij analyseren: ${err.message}`)
    } finally {
      setUploaden(false)
    }
  }

  function handleOpslaan(e) {
    e.preventDefault()
    const verschil = (formData.hrMaxStaand && formData.hrBaseline)
      ? Math.round(formData.hrMaxStaand - formData.hrBaseline)
      : null
    saveTest({ ...formData, verschil })
    setOpgeslagen(true)
    setTimeout(onOpgeslagen, 600)
  }

  const verschil = formData.hrMaxStaand && formData.hrBaseline
    ? Math.round(Number(formData.hrMaxStaand) - Number(formData.hrBaseline))
    : null

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-end justify-center" onClick={onAnnuleren}>
      <div
        className="bg-white w-full max-w-lg rounded-t-2xl p-5 pb-safe space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">NASA Lean Test</h2>
            <p className="text-xs text-slate-500">10 min supine · 10 min staan · nuchter</p>
          </div>
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

          {/* Screenshot upload */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-blue-800">Garmin screenshot analyseren</p>
            <p className="text-xs text-blue-600">
              Upload een screenshot van de HR-grafiek uit Garmin Connect. Claude AI leest automatisch de waarden uit.
            </p>
            <label className={`flex items-center justify-center gap-2 w-full border-2 border-dashed rounded-lg py-3 text-sm font-medium cursor-pointer transition-colors ${
              uploaden
                ? 'border-blue-300 text-blue-400 bg-blue-50'
                : 'border-blue-400 text-blue-600 hover:bg-blue-100'
            }`}>
              {uploaden ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Analyseren...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Screenshot uploaden
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleScreenshot} disabled={uploaden} />
            </label>
            {uploadFout && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{uploadFout}</p>
            )}
          </div>

          {/* HR waarden */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">HR-waarden (automatisch ingevuld of handmatig)</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label text-xs">HR liggend (bpm)</label>
                <input type="number" min="30" max="200" placeholder="—"
                  value={formData.hrBaseline}
                  onChange={e => set('hrBaseline', e.target.value === '' ? '' : Number(e.target.value))}
                  className="input-field text-center font-semibold" />
                <p className="text-xs text-slate-400 text-center mt-0.5">baseline</p>
              </div>
              <div>
                <label className="label text-xs">HR max staand (bpm)</label>
                <input type="number" min="30" max="250" placeholder="—"
                  value={formData.hrMaxStaand}
                  onChange={e => set('hrMaxStaand', e.target.value === '' ? '' : Number(e.target.value))}
                  className="input-field text-center font-semibold" />
                <p className="text-xs text-slate-400 text-center mt-0.5">maximum</p>
              </div>
              <div>
                <label className="label text-xs">HR na terugliggen</label>
                <input type="number" min="30" max="200" placeholder="—"
                  value={formData.hrNaLiggen}
                  onChange={e => set('hrNaLiggen', e.target.value === '' ? '' : Number(e.target.value))}
                  className="input-field text-center font-semibold" />
                <p className="text-xs text-slate-400 text-center mt-0.5">herstel</p>
              </div>
            </div>

            {/* Verschil berekening */}
            {verschil !== null && (
              <div className={`rounded-xl p-3 text-center ${
                verschil >= 30
                  ? 'bg-red-50 border border-red-200'
                  : verschil >= 20
                  ? 'bg-orange-50 border border-orange-200'
                  : 'bg-green-50 border border-green-200'
              }`}>
                <p className={`text-2xl font-bold ${
                  verschil >= 30 ? 'text-red-700' : verschil >= 20 ? 'text-orange-700' : 'text-green-700'
                }`}>
                  +{verschil} bpm
                </p>
                <p className={`text-xs ${
                  verschil >= 30 ? 'text-red-500' : verschil >= 20 ? 'text-orange-500' : 'text-green-500'
                }`}>
                  {verschil >= 30
                    ? 'POTS-drempel bereikt (≥30 bpm stijging)'
                    : verschil >= 20
                    ? 'Grensgebied (20–29 bpm stijging)'
                    : 'Onder POTS-drempel (<20 bpm)'}
                </p>
              </div>
            )}
          </div>

          {/* Notities */}
          <div>
            <label className="label">Notities</label>
            <textarea
              rows={2}
              placeholder="Klachten tijdens test, omstandigheden..."
              value={formData.notities}
              onChange={e => set('notities', e.target.value)}
              className="input-field resize-none"
            />
          </div>

          <button type="submit"
            className={`btn-primary w-full py-3 text-base ${opgeslagen ? 'bg-green-600 hover:bg-green-600' : ''}`}>
            {opgeslagen ? '✓ Opgeslagen!' : 'Test opslaan'}
          </button>
        </form>
      </div>
    </div>
  )
}
