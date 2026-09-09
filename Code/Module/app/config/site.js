export const TOKEN_KEY = 'console_auth_token'

export const AUTH_ME = '/api/auth/me'

export const CONSOLE_BASE = '/console'

export const CONSOLE_HOME = '/console/'

export const CONSOLE_LOGIN = '/console/login?next=/'

export const CONSOLE_CHAT = '/console/chat'

export const DOCS_URL = '/agents-skill/'

export const REQUIRE_CONSOLE = import.meta.env.VITE_REQUIRE_CONSOLE === 'true'

export const PORTAL_GROUPS = [
  {
    title: '基于本站',
    items: [
      { id: 'overview', label: '概述', href: '/', external: false },
      { id: 'docs', label: '开发者文档', href: DOCS_URL, external: true },
      { id: 'console', label: '控制台登录', href: CONSOLE_LOGIN, external: true, auth: 'login' }
    ]
  },
  {
    title: '与本站合作',
    items: [
      { id: 'mechassist', label: '机械助手', href: CONSOLE_HOME, external: true },
      { id: 'gaode', label: '出行助手', href: '/gaode/', external: true },
      { id: 'glasses', label: '智能眼镜', href: '/glasses/', external: true },
      { id: 'agents', label: 'Agents Skill', href: DOCS_URL, external: true }
    ]
  }
]
