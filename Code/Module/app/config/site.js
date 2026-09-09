export const TOKEN_KEY = 'console_auth_token'

export const AUTH_ME = '/api/auth/me'

export const AUTH_LOGIN = '/api/auth/login'

export const CONSOLE_HOME = '/console/'

export const CONSOLE_LOGIN = '/login'

export const DOCS_URL = '/agents-skill/'

export const REQUIRE_CONSOLE = import.meta.env.VITE_REQUIRE_CONSOLE === 'true'

export function safeNextPath(raw) {
  if (!raw || typeof raw !== 'string') return '/'
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return '/'
  if (raw.startsWith('/login')) return '/'
  return raw
}

export function loginHref(next) {
  const path = safeNextPath(next)
  if (path === '/') return CONSOLE_LOGIN
  return `${CONSOLE_LOGIN}?next=${encodeURIComponent(path)}`
}

export const PORTAL_GROUPS = [
  {
    title: '基于本站',
    items: [
      { id: 'overview', label: '概述', href: '/', external: false },
      { id: 'docs', label: '开发者文档', href: DOCS_URL, external: true, requiresAuth: true },
      { id: 'console', label: '控制台登录', href: CONSOLE_LOGIN, external: false, auth: 'login' }
    ]
  },
  {
    title: '与本站合作',
    items: [
      { id: 'mechassist', label: '机械助手', href: CONSOLE_HOME, external: true, requiresAuth: true },
      { id: 'gaode', label: '出行助手', href: '/gaode/', external: true, requiresAuth: true },
      { id: 'glasses', label: '智能眼镜', href: '/glasses/', external: true, requiresAuth: true },
      { id: 'agents', label: 'Agents Skill', href: DOCS_URL, external: true, requiresAuth: true }
    ]
  }
]
