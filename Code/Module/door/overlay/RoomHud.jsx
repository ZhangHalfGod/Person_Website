import React from 'react'
import { Link } from 'react-router-dom'
import { selectCanExplore, useSessionStore } from '@app/store/sessionStore.js'

export default function RoomHud({ label }) {
  const unlocked = useSessionStore(selectCanExplore)

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute left-1/2 top-5 -translate-x-1/2 text-sm tracking-wide text-white/80">
        Profile
        {label != null ? <span className="ml-3 text-white/45">{label}</span> : null}
      </div>
      {unlocked ? (
        <Link
          to="/"
          className="pointer-events-auto absolute right-6 top-5 text-sm text-white/55 hover:text-corridor-warm"
        >
          Back
        </Link>
      ) : null}
    </div>
  )
}
