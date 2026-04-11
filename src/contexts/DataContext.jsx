import { createContext, useContext, useState, useRef, useCallback } from 'react'
import { persistDagboek, persistTests } from '../utils/crypto.js'
import { upsertItem, removeItem } from '../utils/storage.js'

const DataContext = createContext(null)

export function DataProvider({ cryptoKey, initialDagboek, initialTests, children }) {
  const [dagboek, setDagboek] = useState(initialDagboek)
  const [tests, setTests] = useState(initialTests)

  // Refs to always have latest value without stale closure issues
  const dagboekRef = useRef(initialDagboek)
  const testsRef = useRef(initialTests)

  const saveEntry = useCallback((entry) => {
    const updated = upsertItem(dagboekRef.current, entry)
    dagboekRef.current = updated
    setDagboek(updated)
    persistDagboek(cryptoKey, updated)
  }, [cryptoKey])

  const deleteEntry = useCallback((id) => {
    const updated = removeItem(dagboekRef.current, id)
    dagboekRef.current = updated
    setDagboek(updated)
    persistDagboek(cryptoKey, updated)
  }, [cryptoKey])

  const saveTest = useCallback((test) => {
    const updated = upsertItem(testsRef.current, test)
    testsRef.current = updated
    setTests(updated)
    persistTests(cryptoKey, updated)
  }, [cryptoKey])

  return (
    <DataContext.Provider value={{ dagboek, tests, saveEntry, deleteEntry, saveTest }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  return useContext(DataContext)
}
