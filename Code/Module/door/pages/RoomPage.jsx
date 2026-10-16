import React, { Suspense, useEffect, useLayoutEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { Navigate, useParams } from 'react-router-dom'
import rooms from '@main/data/rooms.json'
import RoomHud from '../overlay/RoomHud.jsx'
import SiteMenu from '@app/overlay/SiteMenu.jsx'
import { REQUIRE_CONSOLE } from '@app/config/site.js'
import { useSessionStore } from '@app/store/sessionStore.js'
import RoomScene from '../scene/RoomScene.jsx'
import { ROOM_VIEW } from '../scene/roomCameraStops.js'
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
        dpr={[1, 2]}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        camera={{
          fov: ROOM_VIEW.fov,
          near: 0.05,
          far: 40,
          position: [...ROOM_VIEW.pos]
        }}
        onCreated={({ gl, camera }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          // C3d：0.92→1.0 验证四槽地板灯塘可读（仍无 hemi）
          gl.toneMappingExposure = 1.0
          camera.up.set(0, 1, 0)
          camera.position.set(ROOM_VIEW.pos[0], ROOM_VIEW.pos[1], ROOM_VIEW.pos[2])
          camera.lookAt(ROOM_VIEW.look[0], ROOM_VIEW.look[1], ROOM_VIEW.look[2])
        }}
        onPointerMissed={(e) => {
          if (e.type === 'click') useRoomStore.getState().retreatFocus()
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
