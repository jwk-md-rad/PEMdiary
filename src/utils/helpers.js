export function formatDatum(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatDatumKort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function vandaag() {
  return new Date().toISOString().split('T')[0]
}

export const SCORE_LABELS = {
  orthostatisch: 'Orthostatische klachten',
  energie: 'Energieniveau',
  slaap: 'Slaapkwaliteit',
}

// score 1-5: 1=best/laag, 5=worst/hoog
// For orthostatisch: 1=geen klachten (goed), 5=ernstig (slecht)
// For energie: 1=geen energie (slecht), 5=veel energie (goed)
// For slaap: 1=slecht geslapen, 5=goed geslapen
// We use a neutral color scale for display, user interprets context
export const SCORE_COLORS = {
  orthostatisch: ['', '#16a34a', '#84cc16', '#eab308', '#f97316', '#ef4444'], // low=good
  energie:       ['', '#ef4444', '#f97316', '#eab308', '#84cc16', '#16a34a'], // high=good
  slaap:         ['', '#ef4444', '#f97316', '#eab308', '#84cc16', '#16a34a'], // high=good
}

export function scoreKleurOrtho(score) {
  // orthostatisch: 1=groen (weinig klachten), 5=rood (veel klachten)
  const map = {
    1: { bg: 'bg-green-100', text: 'text-green-700', hex: '#16a34a' },
    2: { bg: 'bg-lime-100',  text: 'text-lime-700',  hex: '#84cc16' },
    3: { bg: 'bg-yellow-100',text: 'text-yellow-700',hex: '#eab308' },
    4: { bg: 'bg-orange-100',text: 'text-orange-700',hex: '#f97316' },
    5: { bg: 'bg-red-100',   text: 'text-red-700',   hex: '#ef4444' },
  }
  return map[score] || map[3]
}

export function scoreKleurPositief(score) {
  // energie/slaap: 1=rood (slecht), 5=groen (goed)
  const map = {
    1: { bg: 'bg-red-100',   text: 'text-red-700',   hex: '#ef4444' },
    2: { bg: 'bg-orange-100',text: 'text-orange-700',hex: '#f97316' },
    3: { bg: 'bg-yellow-100',text: 'text-yellow-700',hex: '#eab308' },
    4: { bg: 'bg-lime-100',  text: 'text-lime-700',  hex: '#84cc16' },
    5: { bg: 'bg-green-100', text: 'text-green-700', hex: '#16a34a' },
  }
  return map[score] || map[3]
}

// Rotating daily tip from interventions
const TIPS = [
  { titel: 'Zout & vocht', tekst: 'Drink 2,5–3 L vocht. Begin met bouillon of isotone sportdrank. Voeg extra zout toe aan maaltijden.' },
  { titel: 'Houdingsaanpassing', tekst: 'Douchen zittend of koud/lauw. Koken op barkruk. Na opstaan 1–2 min aan de bedrand zitten.' },
  { titel: 'Compressiekousen', tekst: 'Compressiekousen aantrekken vóór je opstaat op drukke dagen.' },
  { titel: 'Vaste wektijd', tekst: 'Houd vandaag je vaste wektijd aan — ook in het weekend. Sterkste circadiane anker.' },
  { titel: 'Magnesiumbisglycinaat', tekst: '300–400 mg elementair magnesium voor bed. Controleer het etiket op elementair gehalte.' },
  { titel: 'Horizontale pauze', tekst: 'Neem 10 minuten liggend rust na de lunch en/of halverwege de middag.' },
  { titel: 'Garmin HR-alarm', tekst: 'HR-alarm ingesteld op 100? Controleer bij douchen, koken en traplopen of je boven 100 gaat.' },
  { titel: 'Countermanoeuver', tekst: 'Bij plotselinge tachycardie: beenkruisen, kuitspieren aanspannen, of hurken.' },
  { titel: 'Cafeïne stop', tekst: 'Geen cafeïne meer na 13:00 voor betere slaap en lagere nacht-HR.' },
  { titel: 'Cognitief budget', tekst: 'Zware cognitieve taken (rapport, diagnose) clusteren in de ochtend. Houd de middag lichter.' },
  { titel: 'Resonantie-ademhaling', tekst: '5 minuten voor bed: 5–6 ademhalingen per minuut. Verhoogt HRV en vergemakkelijkt diepe slaap.' },
  { titel: 'Slaapomgeving', tekst: 'Slaapkamer 18–19 °C. Geen schermen 60 min voor bed, blauwlichtfilter vanaf 21:00.' },
  { titel: 'Koken op barkruk', tekst: 'Koken staand verhoogt je HR structureel. Gebruik een barkruk om de orthostatische load te verlagen.' },
  { titel: 'Opstaan na slaap', tekst: 'Na het wakker worden: 1–2 minuten aan de bedrand zitten voor je staat.' },
  { titel: 'Slaaptijd', tekst: 'Elke dag dezelfde wektijd programmeert je circadiaan ritme en ondersteunt autonome herstel.' },
]

export function dagelijkse_tip() {
  const dag = Math.floor(Date.now() / (1000 * 60 * 60 * 24))
  return TIPS[dag % TIPS.length]
}
