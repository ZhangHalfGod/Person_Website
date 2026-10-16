import React, { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useRoomMaterials } from './useRoomMaterials.js'
import RoomInterior from './RoomInterior.jsx'
import EntryDoor from './EntryDoor.jsx'
import FlickerLights from './FlickerLights.jsx'
import Furniture from './Furniture.jsx'
import TableLamp from './TableLamp.jsx'
import Painting from './Painting.jsx'
import Blackboard from './Blackboard.jsx'
import { getCameraStop } from './roomCameraStops.js'
import { useRoomStore } from '../store/roomStore.js'

/** Deep near-black — Goal3 cinematic darks (no cool gray fill). */
const FOG = '#040506'

function RoomCamera() {
  const camera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)
  const focus = useRoomStore((s) => s.focus)
  const zoom = useRoomStore((s) => s.zoom)
  const retreatFocus = useRoomStore((s) => s.retreatFocus)
  const look = useRef(new THREE.Vector3(...getCameraStop(null, 0).look))
  const targetLook = useRef(new THREE.Vector3())
  const targetPos = useRef(new THREE.Vector3())

  useEffect(() => {
    const el = gl.domElement
    const onCtx = (e) => {
      e.preventDefault()
      retreatFocus()
    }
    el.addEventListener('contextmenu', onCtx)
    return () => el.removeEventListener('contextmenu', onCtx)
  }, [gl, retreatFocus])

  useFrame((_, dt) => {
    // DEV / B1-11: window.__shotCam = { pos, look, fov } snaps camera for stills
    const shot = typeof window !== 'undefined' ? window.__shotCam : null
    if (shot?.pos && shot?.look) {
      camera.position.set(shot.pos[0], shot.pos[1], shot.pos[2])
      look.current.set(shot.look[0], shot.look[1], shot.look[2])
      camera.up.set(0, 1, 0)
      camera.lookAt(look.current)
      if (typeof shot.fov === 'number') {
        camera.fov = shot.fov
        camera.updateProjectionMatrix()
      }
      return
    }
    const stop = getCameraStop(focus, zoom)
    targetPos.current.set(stop.pos[0], stop.pos[1], stop.pos[2])
    targetLook.current.set(stop.look[0], stop.look[1], stop.look[2])
    const k = 1 - Math.exp(-3.2 * dt)
    camera.position.lerp(targetPos.current, k)
    look.current.lerp(targetLook.current, k)
    camera.up.set(0, 1, 0)
    camera.lookAt(look.current)
    if (typeof stop.fov === 'number') {
      camera.fov += (stop.fov - camera.fov) * k
      camera.updateProjectionMatrix()
    }
  })

  return null
}

export default function RoomScene() {
  const materials = useRoomMaterials()
  const startedAt = useMemo(() => performance.now(), [])

  return (
    <>
      <color attach="background" args={[FOG]} />
      {/* Far fog only — avoids mid-room gray wash vs v1. */}
      <fog attach="fog" args={[FOG, 18, 32]} />
      {/* IBL skipped: warehouse HDR would Suspense-block + lift blacks; brass uses LM. */}
      <RoomCamera />
      <RoomInterior materials={materials} />
      <EntryDoor materials={materials} startedAt={startedAt} />
      <FlickerLights startedAt={startedAt} materials={materials} />
      <Furniture materials={materials} />
      <TableLamp startedAt={startedAt} />
      <Painting materials={materials} />
      <Blackboard materials={materials} />
    </>
  )
}
