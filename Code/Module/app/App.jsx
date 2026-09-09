import React, { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProfilePage from '@main/pages/ProfilePage.jsx'
import RoomPage from '@door/pages/RoomPage.jsx'
import { useSessionStore } from './store/sessionStore.js'

export default function App() {
  const refresh = useSessionStore((s) => s.refresh)

  useEffect(() => {
    refresh()
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  return (
    <Routes>
      <Route path="/" element={<ProfilePage />} />
      <Route path="/room/:doorId" element={<RoomPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
