import { useState } from 'react'
import { isPasswordSet, setupPassword, verifyPassword, loadEntries, resetAll } from '../utils/crypto.js'

export default function AuthScreen({ onAuth }) {
  const heeftWachtwoord = isPasswordSet()
  const [wachtwoord, setWachtwoord] = useState('')
  const [bevestig, setBevestig] = useState('')
  const [fout, setFout] = useState('')
  const [laden, setLaden] = useState(false)
  const [resetModus, setResetModus] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setFout('')
    setLaden(true)
    try {
      if (!heeftWachtwoord) {
        if (wachtwoord.length < 6) { setFout('Minimaal 6 tekens'); return }
        if (wachtwoord !== bevestig) { setFout('Wachtwoorden komen niet overeen'); return }
        const key = await setupPassword(wachtwoord)
        onAuth(key, [])
      } else {
        const key = await verifyPassword(wachtwoord)
        if (!key) { setFout('Onjuist wachtwoord'); return }
        const entries = await loadEntries(key)
        onAuth(key, entries)
      }
    } catch (err) {
      setFout('Er is iets misgegaan. Probeer opnieuw.')
    } finally {
      setLaden(false)
    }
  }

  function handleReset() {
    resetAll()
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="card max-w-sm w-full shadow-lg">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900">PEM Dagboek</h1>
          <p className="text-sm text-slate-500 mt-1">
            {heeftWachtwoord ? 'Voer je wachtwoord in om je dagboek te openen' : 'Kies een wachtwoord — je gegevens worden versleuteld opgeslagen'}
          </p>
        </div>

        {!resetModus ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Wachtwoord</label>
              <input
                type="password"
                value={wachtwoord}
                onChange={e => { setWachtwoord(e.target.value); setFout('') }}
                className="input-field"
                placeholder="••••••••"
                autoFocus
                required
              />
            </div>

            {!heeftWachtwoord && (
              <div>
                <label className="label">Bevestig wachtwoord</label>
                <input
                  type="password"
                  value={bevestig}
                  onChange={e => { setBevestig(e.target.value); setFout('') }}
                  className="input-field"
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            {fout && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{fout}</p>
            )}

            <button type="submit" disabled={laden} className="btn-primary w-full disabled:opacity-60">
              {laden ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Even geduld...
                </span>
              ) : heeftWachtwoord ? 'Openen' : 'Account aanmaken'}
            </button>

            {heeftWachtwoord && (
              <button type="button" onClick={() => setResetModus(true)}
                className="w-full text-xs text-slate-400 hover:text-slate-600 py-1">
                Wachtwoord vergeten / alles wissen
              </button>
            )}
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-700 mb-1">⚠️ Alle data wordt gewist</p>
              <p className="text-xs text-red-600">
                Je kunt je wachtwoord niet herstellen. Als je verder gaat, worden al je dagboekentries permanent verwijderd.
              </p>
            </div>
            <button onClick={handleReset} className="btn-danger w-full">
              Ja, alles wissen en opnieuw beginnen
            </button>
            <button onClick={() => setResetModus(false)} className="btn-secondary w-full">
              Annuleren
            </button>
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            AES-256 versleuteld · alleen leesbaar met jouw wachtwoord
          </p>
        </div>
      </div>
    </div>
  )
}
