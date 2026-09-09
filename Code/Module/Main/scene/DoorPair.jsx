import React, { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import rooms from '@main/data/rooms.json'
import { getDoorZ } from './cameraStops.js'
import { INNER_WIDTH, DOOR_W } from './corridorLayout.js'
import { CAMERA_PHASE, DOOR_OPEN_DURATION, useCorridorStore } from '../store/corridorStore.js'
import { useSessionStore } from '@app/store/sessionStore.js'
import { easeInOutCubic } from './easing.js'
import { applyNamedMaterials, cloneGltf, doorMaterialFor } from './gltfShared.js'

const OPEN_RAD = 1.72
const DOOR_URL = '/models/corridor_door.glb?v=2'

function useLabelMap(text) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#c4a056'
    ctx.fillRect(0, 0, 128, 64)
    ctx.fillStyle = '#1c1208'
    ctx.font = '700 42px Georgia, Times New Roman, serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(text), 64, 34)
    const map = new THREE.CanvasTexture(canvas)
    map.colorSpace = THREE.SRGBColorSpace
    return map
  }, [text])
}

function DoorLabel({ text, position }) {
  const map = useLabelMap(text)
  return (
    <mesh position={position}>
      <planeGeometry args={[0.28, 0.13]} />
      <meshStandardMaterial map={map} metalness={0.45} roughness={0.38} />
    </mesh>
  )
}

function WoodenDoor({ room, materials, scene }) {
  const { side, label, id: doorId, stopIndex } = room
  const hingeRef = useRef()
  const progressRef = useRef(0)
  const gl = useThree((state) => state.gl)
  const clickDoor = useCorridorStore((s) => s.clickDoor)
  const cameraPhase = useCorridorStore((s) => s.cameraPhase)
  const facingDoorId = useCorridorStore((s) => s.facingDoorId)
  const currentStop = useCorridorStore((s) => s.stopIndex)
  const unlocked = useSessionStore((s) => s.status === 'unlocked')

  const hingeX = side === 'left' ? -(INNER_WIDTH / 2) + 0.01 : INNER_WIDTH / 2 - 0.01
  const xSign = side === 'left' ? 1 : -1
  const clickable =
    unlocked &&
    stopIndex === currentStop &&
    (cameraPhase === CAMERA_PHASE.LOOK_FORWARD || cameraPhase === CAMERA_PHASE.FACING_DOOR)

  const clone = useMemo(() => cloneGltf(scene), [scene])
  const leaf = useMemo(() => clone.getObjectByName('DoorLeaf'), [clone])
  const frame = useMemo(() => clone.getObjectByName('DoorFrame'), [clone])
  const labelPos = useMemo(() => {
    const anchor = clone.getObjectByName('LabelAnchor')
    return anchor ? [anchor.position.x, anchor.position.y, anchor.position.z] : [0.09, 1.81, -0.48]
  }, [clone])

  useLayoutEffect(() => {
    if (leaf) applyNamedMaterials(leaf, (name) => doorMaterialFor(name, materials))
    if (frame) {
      applyNamedMaterials(frame, (name) => doorMaterialFor(name, materials), { raycast: false })
    }
  }, [leaf, frame, materials])

  useFrame((_, delta) => {
    const opening = cameraPhase === CAMERA_PHASE.DOOR_OPENING && facingDoorId === doorId
    if (opening) {
      progressRef.current = Math.min(1, progressRef.current + delta / DOOR_OPEN_DURATION)
    } else if (facingDoorId !== doorId) {
      progressRef.current = 0
    }
    if (hingeRef.current) {
      // GLB hinge at +Z, leaf extends −Z; negative yaw opens into the corridor.
      hingeRef.current.rotation.y = -OPEN_RAD * easeInOutCubic(progressRef.current)
    }
  })

  const onDoorClick = (event) => {
    event.stopPropagation()
    if (!unlocked) return
    clickDoor(room)
  }

  return (
    <group position={[hingeX, 0, DOOR_W / 2]} scale={[xSign, 1, 1]}>
      {frame ? <primitive object={frame} /> : null}
      <group
        ref={hingeRef}
        onClick={onDoorClick}
        onPointerOver={() => {
          gl.domElement.style.cursor = clickable ? 'pointer' : 'auto'
        }}
        onPointerOut={() => {
          gl.domElement.style.cursor = 'auto'
        }}
      >
        {leaf ? <primitive object={leaf} /> : null}
        <DoorLabel text={label} position={labelPos} />
      </group>
    </group>
  )
}

export default function DoorPair({ stopIndex, materials }) {
  const z = getDoorZ(stopIndex)
  const pair = rooms.filter((room) => room.stopIndex === stopIndex)
  const { scene } = useGLTF(DOOR_URL)

  return (
    <group position={[0, 0, z]}>
      {pair.map((room) => (
        <WoodenDoor key={room.id} room={room} materials={materials} scene={scene} />
      ))}
    </group>
  )
}

useGLTF.preload(DOOR_URL)
