const KEY_SALT = 'pemdiary_salt'
const KEY_VERIFY = 'pemdiary_verify'
const KEY_DAGBOEK = 'pemdiary_dagboek'
const KEY_TESTS = 'pemdiary_tests'
const VERIFY_MARKER = 'pemdiary_verified_v2'

function toBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function fromBase64(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}

async function deriveKey(password, salt) {
  const raw = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password),
    'PBKDF2', false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
    raw,
    { name: 'AES-GCM', length: 256 },
    false, ['encrypt', 'decrypt']
  )
}

async function encryptBlob(key, value) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(JSON.stringify(value))
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  return JSON.stringify({ iv: toBase64(iv), data: toBase64(encrypted) })
}

async function decryptBlob(key, raw) {
  const { iv, data } = JSON.parse(raw)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(iv) },
    key, fromBase64(data)
  )
  return JSON.parse(new TextDecoder().decode(decrypted))
}

export function isPasswordSet() {
  return !!localStorage.getItem(KEY_SALT)
}

export async function setupPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await deriveKey(password, salt)
  localStorage.setItem(KEY_SALT, toBase64(salt))
  localStorage.setItem(KEY_VERIFY, await encryptBlob(key, VERIFY_MARKER))
  return key
}

export async function verifyPassword(password) {
  const saltRaw = localStorage.getItem(KEY_SALT)
  if (!saltRaw) return null
  try {
    const key = await deriveKey(password, fromBase64(saltRaw))
    const marker = await decryptBlob(key, localStorage.getItem(KEY_VERIFY))
    return marker === VERIFY_MARKER ? key : null
  } catch {
    return null
  }
}

export async function loadDagboek(key) {
  const raw = localStorage.getItem(KEY_DAGBOEK)
  if (!raw) return []
  try {
    return await decryptBlob(key, raw)
  } catch {
    return []
  }
}

export async function persistDagboek(key, entries) {
  localStorage.setItem(KEY_DAGBOEK, await encryptBlob(key, entries))
}

export async function loadTests(key) {
  const raw = localStorage.getItem(KEY_TESTS)
  if (!raw) return []
  try {
    return await decryptBlob(key, raw)
  } catch {
    return []
  }
}

export async function persistTests(key, tests) {
  localStorage.setItem(KEY_TESTS, await encryptBlob(key, tests))
}

export function resetAll() {
  ;[KEY_SALT, KEY_VERIFY, KEY_DAGBOEK, KEY_TESTS].forEach(k => localStorage.removeItem(k))
}

// Settings are stored unencrypted (not health data)
const KEY_SETTINGS = 'pemdiary_settings'
const DEFAULT_SETTINGS = { claudeApiKey: '', onesignalAppId: 'fe5f5231-527c-4382-a215-e18e8e86e768', notificatieTijd: '08:00' }

export function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEY_SETTINGS) || '{}') }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings) {
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(settings))
}
