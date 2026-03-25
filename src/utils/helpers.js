export function formatDatum(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDatumKort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

export function symptoomKleur(waarde) {
  if (waarde <= 2) return 'text-green-600'
  if (waarde <= 4) return 'text-yellow-600'
  if (waarde <= 6) return 'text-orange-500'
  return 'text-red-600'
}

export function symptoomBgKleur(waarde) {
  if (waarde <= 2) return 'bg-green-100 text-green-800'
  if (waarde <= 4) return 'bg-yellow-100 text-yellow-800'
  if (waarde <= 6) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
}

export function symptoomChartKleur(naam) {
  const kleuren = {
    vermoeidheid: '#2563eb',
    pijn: '#dc2626',
    brainFog: '#7c3aed',
    pots: '#ea580c',
    ziekgevoel: '#059669',
  }
  return kleuren[naam] || '#6b7280'
}

export const SYMPTOOM_LABELS = {
  vermoeidheid: 'Vermoeidheid',
  pijn: 'Spier-/gewrichtspijn',
  brainFog: 'Brain fog',
  pots: 'POTS/HR-klachten',
  ziekgevoel: 'Ziek/griepgevoel',
}

export const KWALITEIT_LABELS = {
  slecht: 'Slecht',
  matig: 'Matig',
  goed: 'Goed',
}

export function gemSymptoomScore(symptomen) {
  if (!symptomen) return null
  const waarden = Object.values(symptomen)
  return Math.round((waarden.reduce((a, b) => a + b, 0) / waarden.length) * 10) / 10
}

export function maxPEMStijging(entry) {
  const t0 = entry.symptomen?.t0
  const latere = [entry.symptomen?.t24, entry.symptomen?.t48, entry.symptomen?.t72].filter(Boolean)
  if (!t0 || latere.length === 0) return null

  const t0gem = gemSymptoomScore(t0)
  const maxLater = Math.max(...latere.map(s => gemSymptoomScore(s)))
  return Math.round((maxLater - t0gem) * 10) / 10
}

export function berekenBelasting(activiteiten) {
  if (!activiteiten || activiteiten.length === 0) return 0
  return activiteiten.reduce((sum, a) => sum + (a.duur || 0) * (a.rpe || 0) / 10, 0)
}

export function vandaag() {
  return new Date().toISOString().split('T')[0]
}
