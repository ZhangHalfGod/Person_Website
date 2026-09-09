import React, { Suspense, useEffect, useLayoutEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Navigate, useParams } from 'react-router-dom'
import rooms from '@main/data/rooms.json'
import RoomHud from '../overlay/RoomHud.jsx'
import SiteMenu from '@app/overlay/SiteMenu.jsx'
import { REQUIRE_CONSOLE } from '@app/config/site.js'
import { useSessionStore } from '@app/store/sessionStore.js'
import RoomScene from '../scene/RoomScene.jsx'
import { CAM_LOOK, CAM_POS } from '../scene/roomLayout.js'
import { FLICKER_DURATION } from '../scene/introTimeline.js'
import { ROOM_PHASE, useRoomStore } from '../store/roomStore.js'

function ResetIntro({ doorId }) {
  const resetIntro = useRoomStore((s) => s.resetIntro)
  const setPhase = useRoomStore((s) => s.setPhase)

  useLayoutEffect(() => {
    resetIntro()
  }, [doorId, resetIntro])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPhase(ROOM_PHASE.LIGHTS_STABLE)
    }, (FLICKER_DURATION + 0.08) * 1000)
    return () => window.clearTimeout(timer)
  }, [doorId, setPhase])

  return null
}

export default function RoomPage() {
  const { doorId } = useParams()
  const room = rooms.find((item) => item.id === doorId)
  const status = useSessionStore((s) => s.status)

  if (!room) {
    return <Navigate to="/" replace />
  }

  if (REQUIRE_CONSOLE && status === 'guest') {
    return <Navigate to={`/login?next=/room/${doorId}`} replace />
  }

  if (REQUIRE_CONSOLE && status === 'checking') {
    return <div className="min-h-screen w-full bg-corridor-bg" />
  }

  return (
    <div className="relative h-full min-h-screen w-full overflow-hidden bg-corridor-bg">
      <ResetIntro doorId={doorId} />
      <Canvas
        key={doorId}
        className="absolute inset-0 h-full w-full"
        shadows
        dpr={[1, 1.75]}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        camera={{ fov: 72, near: 0.08, far: 40, position: [0.55, 1.56, -3.38] }}
        onCreated={({ gl, camera }) => {
          gl.toneMappingExposure = 1.05
          camera.up.set(0, 1, 0)
          camera.position.set(CAM_POS[0], CAM_POS[1], CAM_POS[2])
          camera.lookAt(CAM_LOOK[0], CAM_LOOK[1], CAM_LOOK[2])
        }}
      >
        <Suspense fallback={null}>
          <RoomScene />
        </Suspense>
      </Canvas>
      <RoomHud label={room.label} />
      <SiteMenu />
    </div>
  )
}
