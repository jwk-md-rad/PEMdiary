const STORAGE_KEY = 'pemdiary_entries'

export function getEntries() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
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
    symptomen: {
      t0: legeSymptomen(),
      t24: null,
      t48: null,
      t72: null,
    },
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

export function getFollowUpEntries() {
  const entries = getEntries()
  const today = new Date()
  const result = []

  for (const entry of entries) {
    const entryDate = new Date(entry.datum)
    const diffDays = Math.round((today - entryDate) / (1000 * 60 * 60 * 24))

    if (diffDays === 1 && !entry.symptomen.t24) {
      result.push({ entry, timepoint: 't24', label: '+24u', diffDays })
    }
    if (diffDays === 2 && !entry.symptomen.t48) {
      result.push({ entry, timepoint: 't48', label: '+48u', diffDays })
    }
    if (diffDays === 3 && !entry.symptomen.t72) {
      result.push({ entry, timepoint: 't72', label: '+72u', diffDays })
    }
  }

  return result
}
