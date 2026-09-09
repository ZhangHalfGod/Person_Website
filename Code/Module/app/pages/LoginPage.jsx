import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import SiteMenu from '../overlay/SiteMenu.jsx'
import { safeNextPath } from '../config/site.js'
import { selectSignedIn, useSessionStore } from '../store/sessionStore.js'

function goAfterLogin(navigate, next) {
  const path = safeNextPath(next)
  if (path === '/' || path.startsWith('/room')) {
    navigate(path, { replace: true })
    return
  }
  window.location.assign(path)
}

export default function LoginPage() {
  const login = useSessionStore((s) => s.login)
  const signedIn = useSessionStore(selectSignedIn)
  const status = useSessionStore((s) => s.status)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'checking' || !signedIn) return
    goAfterLogin(navigate, next)
  }, [status, signedIn, navigate, next])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError('请填写邮箱和密码')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(email.trim(), password)
      goAfterLogin(navigate, next)
    } catch (err) {
      setError(err.message || '登录失败，请检查邮箱和密码')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-corridor-bg">
      <SiteMenu />
      <div className="absolute left-1/2 top-5 z-10 -translate-x-1/2 text-sm tracking-wide text-white/80">
        Profile
      </div>
      <div className="flex min-h-screen items-center justify-center px-4 py-24">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md border border-white/10 bg-neutral-900 px-8 py-10"
        >
          <p className="text-xs tracking-wide text-white/40">控制台</p>
          <h1 className="mt-2 text-2xl tracking-wide text-white">登录</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/45">
            登录后可进入机械助手、出行助手、智能眼镜与 Agents Skill。
          </p>

          {error ? (
            <p className="mt-5 border border-red-500/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <label className="mt-8 block text-xs tracking-wide text-white/40" htmlFor="console-email">
            邮箱
          </label>
          <input
            id="console-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              setError('')
            }}
            className="mt-2 w-full border border-white/15 bg-black/40 px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-corridor-warm"
            placeholder="name@example.com"
          />

          <label className="mt-5 block text-xs tracking-wide text-white/40" htmlFor="console-password">
            密码
          </label>
          <div className="relative mt-2">
            <input
              id="console-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setError('')
              }}
              className="w-full border border-white/15 bg-black/40 px-3 py-3 pr-16 text-sm text-white outline-none placeholder:text-white/25 focus:border-corridor-warm"
              placeholder="请输入密码"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-3 text-xs text-white/40 hover:text-white/70"
            >
              {showPassword ? '隐藏' : '显示'}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full bg-corridor-warm py-3 text-sm font-medium text-[#1c1208] hover:bg-[#f0b56a] disabled:opacity-50"
          >
            {loading ? '登录中…' : '登录'}
          </button>

          <Link
            to="/"
            className="mt-6 block text-center text-sm text-white/40 hover:text-white/70"
          >
            返回门户
          </Link>
        </form>
      </div>
    </div>
  )
}
