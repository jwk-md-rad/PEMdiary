export function vandaag() {
  return new Date().toISOString().split('T')[0]
}

export function createLeegEntry(datum) {
  return {
    id: null,
    datum: datum || vandaag(),
    orthostatisch: 3,
    energie: 3,
    slaap: 3,
    ochtendHR: '',
    hrv: '',
    notities: '',
  }
}

export const STAAND_MINUTEN = [2, 4, 6, 8, 10]

export function createLeegTest(datum) {
  return {
    id: null,
    datum: datum || vandaag(),
    hrBaseline: '',
    hr2: '', hr4: '', hr6: '', hr8: '', hr10: '',
    hrNaLiggen: '',
    notities: '',
  }
}

export function hrMaxStaand(test) {
  const waarden = STAAND_MINUTEN.map(m => Number(test[`hr${m}`])).filter(v => v > 0)
  return waarden.length ? Math.max(...waarden) : null
}

export function upsertItem(items, item) {
  const now = new Date().toISOString()
  const updated = {
    ...item,
    id: item.id || `item_${Date.now()}`,
    bijgewerkt: now,
    aangemaakt: item.aangemaakt || now,
  }
  const idx = items.findIndex(e => e.id === updated.id)
  const arr = idx >= 0
    ? items.map((e, i) => (i === idx ? updated : e))
    : [...items, updated]
  return arr.sort((a, b) => b.datum.localeCompare(a.datum))
}

export function removeItem(items, id) {
  return items.filter(e => e.id !== id)
}

export function dagsSindsLaatsteTest(tests) {
  if (!tests || tests.length === 0) return Infinity
  const latest = new Date(tests[0].datum + 'T00:00:00')
  const nu = new Date()
  return Math.floor((nu - latest) / (1000 * 60 * 60 * 24))
}
