import { create } from 'zustand'
import { AUTH_LOGIN, AUTH_ME, REQUIRE_CONSOLE, TOKEN_KEY } from '../config/site.js'

const IDB_NAME = 'LifeCoachAuthDB'
const IDB_STORE = 'authData'

function readLocalToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY) || window.localStorage.getItem('auth_token')
  } catch {
    return null
  }
}

function persistToken(token) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
    window.localStorage.setItem('auth_token', token)
  } catch {
    /* ignore quota */
  }
}

function clearLocalToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY)
    window.localStorage.removeItem('auth_token')
    window.localStorage.removeItem('user_data')
  } catch {
    /* ignore */
  }
}

function clearIndexedDbToken() {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve()
      return
    }
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve()
    }
    const timer = window.setTimeout(finish, 1200)
    const request = indexedDB.open(IDB_NAME)
    request.onerror = () => {
      window.clearTimeout(timer)
      finish()
    }
    request.onsuccess = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.close()
        window.clearTimeout(timer)
        finish()
        return
      }
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.objectStore(IDB_STORE).delete('auth_data')
      tx.oncomplete = () => {
        db.close()
        window.clearTimeout(timer)
        finish()
      }
      tx.onerror = () => {
        db.close()
        window.clearTimeout(timer)
        finish()
      }
    }
  })
}

function applySignedOut(set) {
  if (REQUIRE_CONSOLE) {
    set({ status: 'guest', user: null, token: null })
    return
  }
  set({ status: 'unlocked', user: null, token: null })
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

function parseAuthPayload(json) {
  const payload = json?.success === true && json.data !== undefined ? json.data : json
  const user = payload?.user || payload
  const token = payload?.token
  if (!token || !user || !user.id) return null
  return { token, user }
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
  status: 'checking',
  user: null,
  token: null,
  requireConsole: REQUIRE_CONSOLE,
  login: async (email, password) => {
    const response = await fetch(AUTH_LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const json = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(json.error || json.message || '登录失败，请检查邮箱和密码')
    }
    const session = parseAuthPayload(json)
    if (!session) {
      throw new Error('服务器返回格式错误')
    }
    persistToken(session.token)
    set({ status: 'unlocked', user: session.user, token: session.token })
    return session
  },
  logout: async () => {
    clearLocalToken()
    await clearIndexedDbToken()
    applySignedOut(set)
  },
  refresh: async () => {
    const applyGuestWalk = () => {
      if (REQUIRE_CONSOLE) {
        set({ status: 'guest', user: null, token: null })
        return false
      }
      set({ status: 'unlocked', user: null, token: null })
      return false
    }
    set({ status: 'checking' })
    try {
      const token = readLocalToken() || (await readIndexedDbToken())
      const session = await verifyToken(token)
      if (!session) return applyGuestWalk()
      persistToken(session.token)
      set({ status: 'unlocked', user: session.user, token: session.token })
      return true
    } catch {
      return applyGuestWalk()
    }
  }
}))

export function selectSignedIn(state) {
  return state.status === 'unlocked' && Boolean(state.user)
}

export function selectCanExplore(state) {
  if (!REQUIRE_CONSOLE) return true
  return state.status === 'unlocked' && Boolean(state.user)
}
