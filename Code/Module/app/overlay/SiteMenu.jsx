import React, { useEffect, useId, useState } from 'react'
import { CONSOLE_CHAT, CONSOLE_LOGIN, PORTAL_GROUPS } from '../config/site.js'
import { useSessionStore } from '../store/sessionStore.js'

function ExternalIcon() {
  return (
    <svg viewBox="0 0 16 16" className="ml-1.5 h-3 w-3 shrink-0 opacity-70" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.5 3.5H3.75A1.25 1.25 0 0 0 2.5 4.75v7.5c0 .69.56 1.25 1.25 1.25h7.5c.69 0 1.25-.56 1.25-1.25V9.5h-1.5v2.75h-7.5v-7.5H6.5v-1.5Zm3-1.5H14v4.5h-1.5V4.56L7.53 9.53 6.47 8.47 11.44 3.5H9.5V2Z"
      />
    </svg>
  )
}

function MenuLink({ item, unlocked, onNavigate }) {
  const isLogin = item.auth === 'login'
  const href = isLogin && unlocked ? CONSOLE_CHAT : item.href
  const label = isLogin && unlocked ? '进入控制台' : item.label
  const external = item.external || (isLogin && unlocked)

  return (
    <a
      href={href}
      className="flex items-center py-2 text-[15px] text-white/90 hover:text-white"
      {...(external ? { target: item.id === 'overview' ? undefined : '_self', rel: 'noreferrer' } : {})}
      onClick={(event) => {
        if (item.id === 'overview') {
          event.preventDefault()
          onNavigate()
        }
      }}
    >
      <span>{label}</span>
      {external && item.id !== 'overview' ? <ExternalIcon /> : null}
    </a>
  )
}

export default function SiteMenu() {
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const status = useSessionStore((s) => s.status)
  const user = useSessionStore((s) => s.user)
  const unlocked = status === 'unlocked'

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        aria-label={open ? '关闭菜单' : '打开菜单'}
        aria-expanded={open}
        aria-controls="site-drawer"
        onClick={() => setOpen((value) => !value)}
        className="pointer-events-auto absolute left-5 top-4 z-[60] flex h-10 w-10 items-center justify-center text-white/85 hover:text-white"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M5 7h14M5 12h14M5 17h14" />
          </svg>
        )}
      </button>

      {open ? (
        <div className="pointer-events-auto absolute inset-0 z-50">
          <button
            type="button"
            aria-label="关闭菜单遮罩"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside
            id="site-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-y-0 left-0 flex w-[min(40rem,86vw)] max-w-full flex-col border-r border-white/15 bg-neutral-900"
          >
            <div className="flex items-start justify-between px-8 pb-2 pt-16">
              <p id={titleId} className="text-sm tracking-wide text-white/45">
                门户
              </p>
              {unlocked && user?.email ? (
                <p className="max-w-[14rem] truncate text-xs text-white/40">{user.email}</p>
              ) : (
                <a href={CONSOLE_LOGIN} className="text-xs text-corridor-warm/80 hover:text-corridor-warm">
                  登录控制台
                </a>
              )}
            </div>
            <div className="grid flex-1 grid-cols-1 gap-10 px-8 py-6 sm:grid-cols-2 sm:gap-0">
              {PORTAL_GROUPS.map((group, index) => (
                <section
                  key={group.title}
                  className={index === 1 ? 'sm:border-l sm:border-white/10 sm:pl-10' : 'sm:pr-10'}
                >
                  <h2 className="mb-4 text-xs tracking-wide text-white/40">{group.title}</h2>
                  <nav className="flex flex-col">
                    {group.items.map((item) => (
                      <MenuLink
                        key={item.id}
                        item={item}
                        unlocked={unlocked}
                        onNavigate={() => setOpen(false)}
                      />
                    ))}
                  </nav>
                </section>
              ))}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}
