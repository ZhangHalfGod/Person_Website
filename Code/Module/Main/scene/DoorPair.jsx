import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import rooms from '@main/data/rooms.json'
import { getDoorZ } from './cameraStops.js'
import {
  INNER_WIDTH,
  WAINSCOT_HEIGHT,
  DOOR_W,
  DOOR_H,
  DOOR_T
} from './corridorLayout.js'
import { CAMERA_PHASE, DOOR_OPEN_DURATION, useCorridorStore } from '../store/corridorStore.js'
import { easeInOutCubic } from './easing.js'

const OPEN_RAD = 1.72

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

function WoodenDoor({ room, materials }) {
  const { side, label, id: doorId, stopIndex } = room
  const hingeRef = useRef()
  const progressRef = useRef(0)
  const gl = useThree((state) => state.gl)
  const clickDoor = useCorridorStore((s) => s.clickDoor)
  const cameraPhase = useCorridorStore((s) => s.cameraPhase)
  const facingDoorId = useCorridorStore((s) => s.facingDoorId)
  const currentStop = useCorridorStore((s) => s.stopIndex)

  const hingeX = side === 'left' ? -(INNER_WIDTH / 2) + 0.01 : INNER_WIDTH / 2 - 0.01
  const faceYaw = side === 'left' ? Math.PI / 2 : -Math.PI / 2
  const knobOut = side === 'left' ? 0.045 : -0.045
  const centerX = side === 'left' ? DOOR_T / 2 + 0.01 : -(DOOR_T / 2 + 0.01)
  const openSign = side === 'left' ? 1 : -1
  const clickable =
    stopIndex === currentStop &&
    (cameraPhase === CAMERA_PHASE.LOOK_FORWARD || cameraPhase === CAMERA_PHASE.FACING_DOOR)

  useFrame((_, delta) => {
    const opening = cameraPhase === CAMERA_PHASE.DOOR_OPENING && facingDoorId === doorId
    if (opening) {
      progressRef.current = Math.min(1, progressRef.current + delta / DOOR_OPEN_DURATION)
    } else if (facingDoorId !== doorId) {
      progressRef.current = 0
    }
    if (hingeRef.current) {
      hingeRef.current.rotation.y = openSign * OPEN_RAD * easeInOutCubic(progressRef.current)
    }
  })

  const onDoorClick = (event) => {
    event.stopPropagation()
    clickDoor(room)
  }

  return (
    <group ref={hingeRef} position={[hingeX, 0, -DOOR_W / 2]}>
      <group
        position={[centerX, DOOR_H / 2, DOOR_W / 2]}
        rotation={[0, faceYaw, 0]}
        onClick={onDoorClick}
        onPointerOver={() => {
          gl.domElement.style.cursor = clickable ? 'pointer' : 'auto'
        }}
        onPointerOut={() => {
          gl.domElement.style.cursor = 'auto'
        }}
      >
        <mesh
          castShadow
          receiveShadow
          material={materials.door}
          onClick={onDoorClick}
          onPointerOver={() => {
            gl.domElement.style.cursor = clickable ? 'pointer' : 'auto'
          }}
          onPointerOut={() => {
            gl.domElement.style.cursor = 'auto'
          }}
        >
          <boxGeometry args={[DOOR_W, DOOR_H, DOOR_T]} />
        </mesh>
        <mesh position={[0, 0.38, DOOR_T / 2 + 0.008]} material={materials.doorPanel}>
          <boxGeometry args={[0.62, 0.72, 0.012]} />
        </mesh>
        <mesh position={[0, -0.42, DOOR_T / 2 + 0.008]} material={materials.doorPanel}>
          <boxGeometry args={[0.62, 0.72, 0.012]} />
        </mesh>
        <DoorLabel text={label} position={[0, 0.72, DOOR_T / 2 + 0.016]} />
        <mesh position={[DOOR_W * 0.28, -0.08, DOOR_T / 2 + knobOut]} material={materials.brass} castShadow>
          <sphereGeometry args={[0.04, 16, 16]} />
        </mesh>
      </group>
    </group>
  )
}

function DoorFrame({ side, materials }) {
  const x = side === 'left' ? -(INNER_WIDTH / 2) + 0.04 : INNER_WIDTH / 2 - 0.04
  const yaw = side === 'left' ? Math.PI / 2 : -Math.PI / 2
  return (
    <group position={[x, WAINSCOT_HEIGHT * 0.72, 0]} rotation={[0, yaw, 0]}>
      <mesh position={[0, DOOR_H / 2 + 0.04, 0]} material={materials.wainscot}>
        <boxGeometry args={[DOOR_W + 0.16, 0.08, 0.1]} />
      </mesh>
    </group>
  )
}

export default function DoorPair({ stopIndex, materials }) {
  const z = getDoorZ(stopIndex)
  const pair = rooms.filter((room) => room.stopIndex === stopIndex)

  return (
    <group position={[0, 0, z]}>
      {pair.map((room) => (
        <group key={room.id}>
          <DoorFrame side={room.side} materials={materials} />
          <WoodenDoor room={room} materials={materials} />
        </group>
      ))}
    </group>
  )
}
