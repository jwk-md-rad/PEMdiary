import { createContext, useContext, useState, useCallback } from 'react'
import { persistEntries } from '../utils/crypto.js'
import { upsertEntry, removeEntry, berekenPEMpatronen } from '../utils/storage.js'

const DataContext = createContext(null)

export function DataProvider({ cryptoKey, initialEntries, children }) {
  const [entries, setEntries] = useState(initialEntries)

  const saveEntry = useCallback((entry) => {
    setEntries(prev => {
      const updated = upsertEntry(prev, entry)
      persistEntries(cryptoKey, updated)
      return updated
    })
  }, [cryptoKey])

  const deleteEntry = useCallback((id) => {
    setEntries(prev => {
      const updated = removeEntry(prev, id)
      persistEntries(cryptoKey, updated)
      return updated
    })
  }, [cryptoKey])

  return (
    <DataContext.Provider value={{ entries, saveEntry, deleteEntry }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  return useContext(DataContext)
}
