const STORAGE_KEY = 'pemdiary_entries'

function migreerEntry(entry) {
  // Oud formaat had symptomen.t0, symptomen.t24, etc. — migreer naar plat formaat
  if (entry.symptomen && entry.symptomen.t0 !== undefined) {
    return { ...entry, symptomen: entry.symptomen.t0 || legeSymptomen() }
  }
  return entry
}

export function getEntries() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    const entries = data ? JSON.parse(data) : []
    return entries.map(migreerEntry)
  } catch {
    return []
  }
}

export function saveEntry(entry) {
  const entries = getEntries()
  const now = new Date().toISOString()
  const newEntry = {
    ...entry,
    id: entry.id || `entry_${Date.now()}`,
    aangemaakt: entry.aangemaakt || now,
    bijgewerkt: now,
  }
  const existing = entries.findIndex(e => e.id === newEntry.id)
  if (existing >= 0) {
    entries[existing] = newEntry
  } else {
    entries.push(newEntry)
  }
  entries.sort((a, b) => b.datum.localeCompare(a.datum))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  return newEntry
}

export function deleteEntry(id) {
  const entries = getEntries().filter(e => e.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function getEntryByDate(datum) {
  return getEntries().find(e => e.datum === datum) || null
}

export function createLeegEntry(datum) {
  return {
    id: null,
    datum: datum || new Date().toISOString().split('T')[0],
    nachtrust: {
      duur: '',
      kwaliteit: 'matig',
      nachtHR: '',
      hrv: '',
    },
    activiteiten: [],
    symptomen: legeSymptomen(),
    extra: {
      rustHROchtend: '',
      medicatie: '',
      cafeine: false,
      alcohol: false,
      notities: '',
    },
  }
}

export function legeSymptomen() {
  return {
    vermoeidheid: 0,
    pijn: 0,
    brainFog: 0,
    pots: 0,
    ziekgevoel: 0,
  }
}

function addDagen(datum, n) {
  const d = new Date(datum)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

// Berekent voor elke dag de symptomen op t=0, +24u, +48u, +72u
// door de symptomen van de volgende dagen op te zoeken
export function berekenPEMpatronen(entries) {
  const byDatum = {}
  entries.forEach(e => { byDatum[e.datum] = e })

  return entries.map(e => ({
    datum: e.datum,
    activiteiten: e.activiteiten || [],
    t0: e.symptomen || null,
    t24: byDatum[addDagen(e.datum, 1)]?.symptomen || null,
    t48: byDatum[addDagen(e.datum, 2)]?.symptomen || null,
    t72: byDatum[addDagen(e.datum, 3)]?.symptomen || null,
  }))
}
