// Pure functions — geen localStorage hier, dat loopt via crypto.js

export function createLeegEntry(datum) {
  return {
    id: null,
    datum: datum || new Date().toISOString().split('T')[0],
    nachtrust: { duur: '', kwaliteit: 'matig', nachtHR: '', hrv: '' },
    activiteiten: [],
    symptomen: legeSymptomen(),
    extra: {
      rustHROchtend: '',
      medicatie: '',
      cafeine: 0,
      alcohol: 0,
      notities: '',
    },
  }
}

export function legeSymptomen() {
  return { vermoeidheid: 0, pijn: 0, brainFog: 0, pots: 0, ziekgevoel: 0 }
}

export function upsertEntry(entries, entry) {
  const now = new Date().toISOString()
  const updated = {
    ...entry,
    id: entry.id || `entry_${Date.now()}`,
    aangemaakt: entry.aangemaakt || now,
    bijgewerkt: now,
  }
  const idx = entries.findIndex(e => e.id === updated.id)
  const arr = idx >= 0
    ? entries.map((e, i) => i === idx ? updated : e)
    : [...entries, updated]
  return arr.sort((a, b) => b.datum.localeCompare(a.datum))
}

export function removeEntry(entries, id) {
  return entries.filter(e => e.id !== id)
}

function addDagen(datum, n) {
  const d = new Date(datum)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

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
