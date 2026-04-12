const BACKUP_VERSIE = 1

export async function exporteerBackup(dagboek, tests) {
  const payload = {
    versie: BACKUP_VERSIE,
    geexporteerd: new Date().toISOString(),
    dagboek,
    tests,
  }
  const json = JSON.stringify(payload, null, 2)
  const bestandsnaam = `pemdiary-backup-${new Date().toISOString().split('T')[0]}.json`

  // iOS Safari: gebruik Web Share API met bestand (werkt op iOS 15+)
  if (navigator.canShare) {
    try {
      const bestand = new File([json], bestandsnaam, { type: 'application/json' })
      if (navigator.canShare({ files: [bestand] })) {
        await navigator.share({ files: [bestand], title: 'PEM Dagboek backup' })
        return
      }
    } catch (err) {
      if (err.name !== 'AbortError') throw err
      return // gebruiker annuleerde share sheet
    }
  }

  // Desktop/Android: standaard download
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = bestandsnaam
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function parseBackup(json) {
  let data
  try {
    data = JSON.parse(json)
  } catch {
    throw new Error('Ongeldig bestand — kan JSON niet lezen.')
  }
  if (!data || typeof data !== 'object') throw new Error('Ongeldig backup-bestand.')
  if (!Array.isArray(data.dagboek))      throw new Error('Geen dagboek-data gevonden in bestand.')
  if (!Array.isArray(data.tests))        throw new Error('Geen test-data gevonden in bestand.')
  return {
    dagboek: data.dagboek,
    tests: data.tests,
    geexporteerd: data.geexporteerd || null,
  }
}
