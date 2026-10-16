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
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-xs tracking-wide text-white/40">
        点击灯 / 壁画 / 白板 / 柜子推进· 右键或空白处后退
        <div className="mt-1 text-white/25">
          壁画：第 1～2 次框内预览，第 3 次进 MechAssist · 灯推到最近后再点：开关台灯
        </div>
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
