import React, { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  CAMERA_PHASE,
  STOP_COUNT,
  WALK_DURATION,
  TURN_DURATION,
  useCorridorStore
} from '../store/corridorStore.js'
import { selectCanExplore, useSessionStore } from '@app/store/sessionStore.js'
import { getStopZ } from './cameraStops.js'
import { CAM_Y } from './corridorLayout.js'
import { easeInOutCubic } from './easing.js'

function applyLookAt(camera, z, look) {
  camera.up.set(0, 1, 0)
  camera.position.set(0, CAM_Y, z)
  camera.lookAt(look[0], look[1], look[2])
}

export default function SceneCamera() {
  const stopIndex = useCorridorStore((s) => s.stopIndex)
  const cameraPhase = useCorridorStore((s) => s.cameraPhase)
  const walkFromZ = useCorridorStore((s) => s.walkFromZ)
  const walkToZ = useCorridorStore((s) => s.walkToZ)
  const lookFrom = useCorridorStore((s) => s.lookFrom)
  const lookTo = useCorridorStore((s) => s.lookTo)
  const finishWalk = useCorridorStore((s) => s.finishWalk)
  const finishTurn = useCorridorStore((s) => s.finishTurn)
  const camera = useThree((state) => state.camera)
  const elapsedRef = useRef(0)
  const phaseRef = useRef(cameraPhase)

  useFrame((_, delta) => {
    if (phaseRef.current !== cameraPhase) {
      elapsedRef.current = 0
      phaseRef.current = cameraPhase
    }

    const zIdle = getStopZ(stopIndex)
    const walking =
      cameraPhase === CAMERA_PHASE.WALKING_FORWARD ||
      cameraPhase === CAMERA_PHASE.WALKING_BACK
    const turning =
      cameraPhase === CAMERA_PHASE.TURNING_TO_DOOR ||
      cameraPhase === CAMERA_PHASE.TURNING_BACK_FORWARD

    if (walking) {
      elapsedRef.current += delta
      const t = Math.min(1, elapsedRef.current / WALK_DURATION)
      const z = walkFromZ + (walkToZ - walkFromZ) * easeInOutCubic(t)
      applyLookAt(camera, z, [0, CAM_Y, z + 20])
      if (t >= 1) finishWalk()
      return
    }

    if (turning) {
      elapsedRef.current += delta
      const t = Math.min(1, elapsedRef.current / TURN_DURATION)
      const e = easeInOutCubic(t)
      const look = [
        lookFrom[0] + (lookTo[0] - lookFrom[0]) * e,
        lookFrom[1] + (lookTo[1] - lookFrom[1]) * e,
        lookFrom[2] + (lookTo[2] - lookFrom[2]) * e
      ]
      applyLookAt(camera, zIdle, look)
      if (t >= 1) finishTurn()
      return
    }

    if (
      cameraPhase === CAMERA_PHASE.FACING_DOOR ||
      cameraPhase === CAMERA_PHASE.DOOR_OPENING
    ) {
      applyLookAt(camera, zIdle, lookTo)
      return
    }

    applyLookAt(camera, zIdle, [0, CAM_Y, zIdle + 20])
  })

  return null
}

function setCursor(el, value) {
  el.style.cursor = value
}

export function WalkHitboxes() {
  const stopIndex = useCorridorStore((s) => s.stopIndex)
  const cameraPhase = useCorridorStore((s) => s.cameraPhase)
  const onMidClick = useCorridorStore((s) => s.onMidClick)
  const walkBack = useCorridorStore((s) => s.walkBack)
  const unlocked = useSessionStore(selectCanExplore)
  const gl = useThree((state) => state.gl)
  const camZ = getStopZ(stopIndex)
  const looking = cameraPhase === CAMERA_PHASE.LOOK_FORWARD
  const facing = cameraPhase === CAMERA_PHASE.FACING_DOOR
  const canForward = unlocked && ((looking && stopIndex < STOP_COUNT - 1) || facing)
  const canBack = unlocked && looking && stopIndex > 0

  if (!unlocked) return null

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.045, camZ + 3.4]}
        onClick={(event) => {
          event.stopPropagation()
          onMidClick()
        }}
        onPointerOver={() => setCursor(gl.domElement, canForward ? 'pointer' : 'default')}
        onPointerOut={() => setCursor(gl.domElement, 'auto')}
      >
        <planeGeometry args={[1.35, 6.2]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {stopIndex > 0 ? (
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.05, camZ - 0.85]}
          onClick={(event) => {
            event.stopPropagation()
            walkBack()
          }}
          onPointerOver={() => setCursor(gl.domElement, canBack ? 'pointer' : 'default')}
          onPointerOut={() => setCursor(gl.domElement, 'auto')}
        >
          <planeGeometry args={[1.3, 1.7]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  )
}
