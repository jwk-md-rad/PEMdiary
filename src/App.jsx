import { useState } from 'react'
import AuthScreen from './components/AuthScreen.jsx'
import InterventiesTab from './components/InterventiesTab.jsx'
import DagboekTab from './components/DagboekTab.jsx'
import Settings from './components/Settings.jsx'
import { DataProvider } from './contexts/DataContext.jsx'

function TabBar({ actief, onChange }) {
  const tabs = [
    {
      id: 'interventies',
      label: 'Interventies',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'dagboek',
      label: 'Dagboek',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'instellingen',
      label: 'Instellingen',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-40">
      <div className="flex max-w-lg mx-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 pt-2 pb-3 transition-colors ${
              actief === tab.id
                ? 'text-blue-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.icon}
            <span className="text-xs font-medium">{tab.label}</span>
            {actief === tab.id && (
              <span className="absolute bottom-0 h-0.5 w-8 bg-blue-600 rounded-t-full" style={{ display: 'none' }} />
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}

function AppHeader({ tab }) {
  const titles = {
    interventies: 'Interventies',
    dagboek: 'Dagboek',
    instellingen: 'Instellingen',
  }
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-slate-200 px-4 py-3 safe-top">
      <h1 className="text-base font-bold text-slate-900">{titles[tab]}</h1>
    </header>
  )
}

export default function App() {
  const [auth, setAuth] = useState(null) // { key, dagboek, tests }
  const [tab, setTab] = useState('dagboek')


  if (!auth) {
    return (
      <AuthScreen
        onAuth={(key, dagboek, tests) => setAuth({ key, dagboek, tests })}
      />
    )
  }

  return (
    <DataProvider
      cryptoKey={auth.key}
      initialDagboek={auth.dagboek}
      initialTests={auth.tests}
    >
      <div className="min-h-screen bg-slate-50">
        <AppHeader tab={tab} />
        <main className="max-w-lg mx-auto">
          {tab === 'interventies'  && <InterventiesTab />}
          {tab === 'dagboek'       && <DagboekTab />}
          {tab === 'instellingen'  && <Settings onUitloggen={() => setAuth(null)} />}
        </main>
        <TabBar actief={tab} onChange={setTab} />
      </div>
    </DataProvider>
  )
}
