import { create } from 'zustand'
import { AUTH_ME, REQUIRE_CONSOLE, TOKEN_KEY } from '../config/site.js'

const IDB_NAME = 'LifeCoachAuthDB'
const IDB_STORE = 'authData'

function readLocalToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY) || window.localStorage.getItem('auth_token')
  } catch {
    return null
  }
}

function readIndexedDbToken() {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null)
      return
    }
    let settled = false
    const finish = (value) => {
      if (settled) return
      settled = true
      resolve(value)
    }
    const timer = window.setTimeout(() => finish(null), 1200)
    const request = indexedDB.open(IDB_NAME)
    request.onerror = () => {
      window.clearTimeout(timer)
      finish(null)
    }
    request.onsuccess = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.close()
        window.clearTimeout(timer)
        finish(null)
        return
      }
      const tx = db.transaction(IDB_STORE, 'readonly')
      const get = tx.objectStore(IDB_STORE).get('auth_data')
      get.onsuccess = () => {
        db.close()
        window.clearTimeout(timer)
        finish(get.result?.token || null)
      }
      get.onerror = () => {
        db.close()
        window.clearTimeout(timer)
        finish(null)
      }
    }
  })
}

async function verifyToken(token) {
  if (!token) return null
  const response = await fetch(AUTH_ME, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!response.ok) return null
  const json = await response.json()
  const payload = json?.success === true && json.data !== undefined ? json.data : json
  const user = payload?.user || payload
  if (!user || !user.id) return null
  return { token, user }
}

export const useSessionStore = create((set, get) => ({
  status: REQUIRE_CONSOLE ? 'checking' : 'unlocked',
  user: null,
  token: null,
  requireConsole: REQUIRE_CONSOLE,
  get unlocked() {
    return get().status === 'unlocked'
  },
  refresh: async () => {
    if (!REQUIRE_CONSOLE) {
      set({ status: 'unlocked', user: null, token: null })
      return true
    }
    set({ status: 'checking' })
    try {
      const token = readLocalToken() || (await readIndexedDbToken())
      const session = await verifyToken(token)
      if (!session) {
        set({ status: 'guest', user: null, token: null })
        return false
      }
      try {
        window.localStorage.setItem(TOKEN_KEY, session.token)
      } catch {
        /* ignore quota */
      }
      set({ status: 'unlocked', user: session.user, token: session.token })
      return true
    } catch {
      set({ status: 'guest', user: null, token: null })
      return false
    }
  }
}))
