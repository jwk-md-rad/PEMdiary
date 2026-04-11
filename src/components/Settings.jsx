import { useState } from 'react'
import { loadSettings, saveSettings, resetAll } from '../utils/crypto.js'

function Sectie({ titel, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{titel}</p>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  )
}

export default function Settings({ onUitloggen }) {
  const [settings, setSettings] = useState(loadSettings)
  const [opgeslagen, setOpgeslagen] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [toonApiKey, setToonApiKey] = useState(false)

  function sla(key, value) {
    const nieuw = { ...settings, [key]: value }
    setSettings(nieuw)
    saveSettings(nieuw)
    setOpgeslagen(true)
    setTimeout(() => setOpgeslagen(false), 1500)
  }

  function handleReset() {
    resetAll()
    window.location.reload()
  }

  return (
    <div className="px-4 pt-4 pb-28 space-y-5">
      {/* Claude API */}
      <Sectie titel="Claude API (screenshot-analyse)">
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Nodig voor het automatisch uitlezen van Garmin screenshots bij de NASA Lean Test.
            Haal je sleutel op via{' '}
            <span className="font-mono bg-slate-100 px-1 rounded">console.anthropic.com</span>{' '}
            → API Keys → Create Key.
          </p>
          <div>
            <label className="label">Claude API-sleutel</label>
            <div className="relative">
              <input
                type={toonApiKey ? 'text' : 'password'}
                placeholder="sk-ant-..."
                value={settings.claudeApiKey}
                onChange={e => sla('claudeApiKey', e.target.value)}
                className="input-field font-mono text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setToonApiKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {toonApiKey ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            De sleutel wordt alleen lokaal opgeslagen op dit apparaat en nooit gedeeld.
          </p>
        </div>
      </Sectie>

      {/* Account */}
      <Sectie titel="Account">
        <div className="space-y-3">
          <button onClick={onUitloggen} className="btn-secondary w-full text-sm">
            Vergrendelen (uitloggen)
          </button>

          {!resetConfirm ? (
            <button onClick={() => setResetConfirm(true)}
              className="w-full text-sm text-red-500 hover:text-red-700 py-2">
              Alle data wissen...
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-red-700">Weet je het zeker?</p>
              <p className="text-xs text-red-600">Alle dagboekentries en testresultaten worden permanent gewist.</p>
              <div className="flex gap-2">
                <button onClick={() => setResetConfirm(false)} className="btn-secondary flex-1 text-sm">Annuleren</button>
                <button onClick={handleReset} className="btn-danger flex-1 text-sm">Ja, wissen</button>
              </div>
            </div>
          )}
        </div>
      </Sectie>

      {opgeslagen && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-600 text-white text-sm px-4 py-2 rounded-full shadow-lg">
          Opgeslagen
        </div>
      )}
    </div>
  )
}
