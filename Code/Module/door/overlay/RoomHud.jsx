import React from 'react'
import { Link } from 'react-router-dom'

export default function RoomHud({ label }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute left-6 top-5 text-sm tracking-wide text-white/80">
        Profile
        {label != null ? <span className="ml-3 text-white/45">{label}</span> : null}
      </div>
      <Link
        to="/"
        className="pointer-events-auto absolute right-6 top-5 text-sm text-white/55 hover:text-corridor-warm"
      >
        Back
      </Link>
    </div>
  )
}
