import { useState } from 'react'
import AuthScreen from './components/AuthScreen.jsx'
import Navigation from './components/Navigation.jsx'
import Dashboard from './components/Dashboard.jsx'
import DagboekForm from './components/DagboekForm.jsx'
import Geschiedenis from './components/Geschiedenis.jsx'
import Grafieken from './components/Grafieken.jsx'
import EntryDetail from './components/EntryDetail.jsx'
import { DataProvider } from './contexts/DataContext.jsx'

export default function App() {
  const [auth, setAuth] = useState(null) // { key, entries }
  const [view, setView] = useState('dashboard')
  const [editEntry, setEditEntry] = useState(null)
  const [detailEntry, setDetailEntry] = useState(null)

  if (!auth) {
    return <AuthScreen onAuth={(key, entries) => setAuth({ key, entries })} />
  }

  function naarNieuw() { setEditEntry(null); setView('nieuw') }
  function naarBewerken(entry) { setEditEntry(entry); setView('nieuw') }
  function naarDetail(entry) { setDetailEntry(entry); setView('detail') }
  function naarDashboard() { setView('dashboard'); setEditEntry(null); setDetailEntry(null) }
  function uitloggen() { setAuth(null); setView('dashboard') }

  return (
    <DataProvider cryptoKey={auth.key} initialEntries={auth.entries}>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="flex-1">
            <h1 className="text-base font-bold text-slate-900 leading-tight">PEM Dagboek</h1>
            <p className="text-xs text-slate-500">Activiteiten & klachten tracken</p>
          </div>
          <button onClick={uitloggen} title="Vergrendelen"
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </button>
        </header>

        <main className="flex-1 max-w-2xl w-full mx-auto pb-24">
          {view === 'dashboard' && (
            <Dashboard onNieuw={naarNieuw} onBewerken={naarBewerken} onDetail={naarDetail} />
          )}
          {view === 'nieuw' && (
            <DagboekForm entry={editEntry} onOpgeslagen={naarDashboard} onAnnuleren={naarDashboard} />
          )}
          {view === 'geschiedenis' && (
            <Geschiedenis onDetail={naarDetail} onBewerken={naarBewerken} />
          )}
          {view === 'grafieken' && <Grafieken />}
          {view === 'detail' && detailEntry && (
            <EntryDetail entry={detailEntry} onBewerken={naarBewerken} onTerug={naarDashboard} />
          )}
        </main>

        {view !== 'nieuw' && <Navigation current={view} onChange={setView} />}
      </div>
    </DataProvider>
  )
}
