import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProfilePage from '@main/pages/ProfilePage.jsx'
import RoomPage from '@door/pages/RoomPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ProfilePage />} />
      <Route path="/room/:doorId" element={<RoomPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
