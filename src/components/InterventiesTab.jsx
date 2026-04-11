const PRIORITEIT_STIJL = {
  hoog: { badge: 'bg-red-100 text-red-700', dot: '#ef4444', label: 'Hoge prioriteit' },
  mid:  { badge: 'bg-amber-100 text-amber-700', dot: '#d97706', label: 'Middelhoge prioriteit' },
  supp: { badge: 'bg-slate-100 text-slate-600', dot: '#94a3b8', label: 'Ondersteunend' },
  data: { badge: 'bg-blue-50 text-blue-600', dot: '#2563eb', label: 'Data / monitoring' },
}

function Badge({ type }) {
  const s = PRIORITEIT_STIJL[type]
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.badge}`}>
      {type}
    </span>
  )
}

function InterventieKaart({ prioriteit, titel, tekst, uitleg }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1.5">
      <div className="flex items-start gap-3">
        <Badge type={prioriteit} />
        <p className="font-semibold text-slate-900 text-sm leading-snug">{titel}</p>
      </div>
      <p className="text-sm text-slate-700 pl-0 leading-relaxed">{tekst}</p>
      {uitleg && <p className="text-xs text-slate-400 italic">{uitleg}</p>}
    </div>
  )
}

function Categorie({ kleur, naam, kinderen }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: kleur }} />
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{naam}</h2>
      </div>
      {kinderen}
    </div>
  )
}

export default function InterventiesTab() {
  return (
    <div className="px-4 pt-4 pb-28 space-y-6">
      {/* Legenda */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        {Object.entries(PRIORITEIT_STIJL).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: v.dot }} />
            {v.label}
          </span>
        ))}
      </div>

      {/* 1. Orthostatisch management */}
      <Categorie kleur="#2563eb" naam="Orthostatisch management" kinderen={
        <>
          <InterventieKaart
            prioriteit="hoog"
            titel="Zout en vocht"
            tekst="3–5 g extra NaCl per dag + 2,5–3 L vocht. Bouillon of isotone sportdrank 's ochtends, extra zout op maaltijden."
            uitleg="Vergroot plasmavolume → verlaagt compensatoire tachycardie"
          />
          <InterventieKaart
            prioriteit="hoog"
            titel="Houdingsaanpassingen ADL"
            tekst="Douchen zittend of koud/lauw. Koken op barkruk. Traplopen in eigen tempo. Na opstaan 1–2 min aan de bedrand zitten."
            uitleg="HR gaat structureel >100 bij douchen en koken — dit wegwerken"
          />
          <InterventieKaart
            prioriteit="mid"
            titel="Compressiekousen"
            tekst="Dijbeinhoog klasse 2 (20–30 mmHg). Aantrekken vóór opstaan. Inzetten op drukke staande dagen."
            uitleg="Vermindert veneus pooling — bij weinig klachten niet dagelijks noodzakelijk"
          />
          <InterventieKaart
            prioriteit="supp"
            titel="Countermanoeuvers"
            tekst="Bij acute tachycardie: beenkruisen, kuitspieren aanspannen, of hurken."
            uitleg="Alleen inzetten bij symptomen"
          />
        </>
      } />

      {/* 2. Slaap */}
      <Categorie kleur="#16a34a" naam="Slaap" kinderen={
        <>
          <InterventieKaart
            prioriteit="hoog"
            titel="Vaste wektijd"
            tekst="Zelfde tijdstip, ook in het weekend. Sterkste circadiane anker."
          />
          <InterventieKaart
            prioriteit="hoog"
            titel="Magnesiumbisglycinaat"
            tekst="300–400 mg elementair magnesium voor bed. Let op elementair gehalte op het etiket (~14% van het zoutgewicht)."
            uitleg="Ondersteunt slow-wave slaap; bij autonome ontregeling verhoogd verbruik"
          />
          <InterventieKaart
            prioriteit="mid"
            titel="Slaapomgeving"
            tekst="Kamertemperatuur 18–19 °C. Geen schermen 60 min voor bed of blauwlichtfilter vanaf 21:00. Geen cafeïne na 13:00."
          />
          <InterventieKaart
            prioriteit="mid"
            titel="Resonantie-ademhaling voor bed"
            tekst="5 min, 5–6 ademhalingen per minuut. Verhoogt parasympathische activiteit en verlaagt instapdrempel voor diepe slaap."
          />
        </>
      } />

      {/* 3. Werk en cognitieve belasting */}
      <Categorie kleur="#d97706" naam="Werk en cognitieve belasting" kinderen={
        <>
          <InterventieKaart
            prioriteit="mid"
            titel="Horizontale pauzes"
            tekst="10 min liggen na de lunch en/of halverwege de middag. Letterlijk plat — verlaagt cumulatieve orthostatische load."
          />
          <InterventieKaart
            prioriteit="mid"
            titel="Cognitief budget bewaken"
            tekst="Complexe diagnostiek en rapportages clusteren in de ochtend. Geen zware taken aan het eind van de dag."
          />
        </>
      } />

      {/* 4. HR-monitoring */}
      <Categorie kleur="#7c3aed" naam="HR-monitoring en grens" kinderen={
        <>
          <InterventieKaart
            prioriteit="hoog"
            titel="HR-alarm <100 ook bij ADL"
            tekst="Garmin HR-alarm instellen op 100 buiten wandelen. Feedback bij douchen, koken en traplopen die structureel >100 gaan."
          />
        </>
      } />

      {/* 5. Monitoring */}
      <Categorie kleur="#6b7280" naam="Monitoring voor 3 juni" kinderen={
        <>
          <InterventieKaart
            prioriteit="data"
            titel="Dagelijks: ochtend-HR + HRV"
            tekst="Supine HR voor opstaan + RMSSD via Garmin. Bijhouden als 7-daags gemiddelde per week."
          />
          <InterventieKaart
            prioriteit="data"
            titel="Wekelijkse stand-test"
            tekst="Zelfde protocol — 10 min supine, 10 min staan. Zelfde tijdstip, nuchter. HR-grafiek fotograferen."
            uitleg="Geeft sportarts een tijdreeks in plaats van één momentopname"
          />
          <InterventieKaart
            prioriteit="data"
            titel="Symptoomdagboek"
            tekst="Dagelijks 3 scores (1–5): orthostatische klachten, energieniveau, slaapkwaliteit. Vijf minuten per dag."
          />
        </>
      } />

      {/* Footer */}
      <p className="text-xs text-slate-400 text-center px-2 pb-2">
        Interventies gelden tot afspraak sportarts op 3 juni. Geen sport of progressieve belasting tot die tijd.
      </p>
    </div>
  )
}
