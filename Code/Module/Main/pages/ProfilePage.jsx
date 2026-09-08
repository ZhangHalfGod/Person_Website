import React, { Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { useNavigate } from 'react-router-dom'
import ProfileHud from '../overlay/ProfileHud.jsx'
import CorridorScene from '../scene/CorridorScene.jsx'
import {
  CAMERA_PHASE,
  DOOR_OPEN_DURATION,
  TURN_DURATION,
  WALK_DURATION,
  useCorridorStore
} from '../store/corridorStore.js'

function WalkKeys() {
  const onMidClick = useCorridorStore((s) => s.onMidClick)
  const walkBack = useCorridorStore((s) => s.walkBack)

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.repeat) return
      if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') {
        event.preventDefault()
        onMidClick()
      }
      if (
        event.key === 'ArrowDown' ||
        event.key === 's' ||
        event.key === 'S' ||
        event.key === 'Backspace'
      ) {
        event.preventDefault()
        walkBack()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onMidClick, walkBack])

  return null
}

function OpenDoorRouter() {
  const navigate = useNavigate()
  const phase = useCorridorStore((s) => s.cameraPhase)
  const doorId = useCorridorStore((s) => s.facingDoorId)

  useEffect(() => {
    if (phase !== CAMERA_PHASE.DOOR_OPENING || doorId == null) return undefined
    const timer = window.setTimeout(() => {
      navigate(`/room/${doorId}`)
    }, DOOR_OPEN_DURATION * 1000)
    return () => window.clearTimeout(timer)
  }, [phase, doorId, navigate])

  return null
}

function ResetLookOnMount() {
  useEffect(() => {
    useCorridorStore.getState().resetLook()
  }, [])
  return null
}

function AnimationWatchdog() {
  const phase = useCorridorStore((s) => s.cameraPhase)
  const finishWalk = useCorridorStore((s) => s.finishWalk)
  const finishTurn = useCorridorStore((s) => s.finishTurn)

  useEffect(() => {
    const walking =
      phase === CAMERA_PHASE.WALKING_FORWARD || phase === CAMERA_PHASE.WALKING_BACK
    const turning =
      phase === CAMERA_PHASE.TURNING_TO_DOOR ||
      phase === CAMERA_PHASE.TURNING_BACK_FORWARD
    if (!walking && !turning) return undefined
    const ms = ((walking ? WALK_DURATION : TURN_DURATION) + 0.08) * 1000
    const timer = window.setTimeout(() => {
      if (walking) finishWalk()
      else finishTurn()
    }, ms)
    return () => window.clearTimeout(timer)
  }, [phase, finishWalk, finishTurn])

  return null
}

export default function ProfilePage() {
  return (
    <div className="relative h-full min-h-screen w-full overflow-hidden bg-corridor-bg">
      <ResetLookOnMount />
      <WalkKeys />
      <AnimationWatchdog />
      <OpenDoorRouter />
      <Canvas
        className="absolute inset-0 h-full w-full"
        shadows
        dpr={[1, 1.75]}
        resize={{ debounce: 0, offsetSize: true }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        camera={{ fov: 72, near: 0.08, far: 90, position: [0, 1.56, 0.01] }}
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.12
        }}
      >
        <Suspense fallback={null}>
          <CorridorScene />
        </Suspense>
      </Canvas>
      <ProfileHud />
    </div>
  )
}
