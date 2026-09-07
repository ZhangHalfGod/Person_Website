import React, { useRef } from 'react'
import { HALF_W, PAINTING, BOARD, TABLE, ROOM_H } from './roomLayout.js'
import { FLICKER_DURATION, flickerFactor, lightBase } from './introTimeline.js'
import { ROOM_PHASE, useRoomStore } from '../store/roomStore.js'
import { useIntroTick } from './useIntroTick.js'

const LAMPS = [
  { pos: [0.05, ROOM_H - 0.22, 0.15], target: 22, dist: 9, phase: 0.2, shadow: true },
  { pos: [0.1, ROOM_H - 0.28, 1.85], target: 16, dist: 8, phase: 1.4, shadow: false },
  { pos: [HALF_W - 0.28, PAINTING.y + PAINTING.h / 2 + 0.16, PAINTING.z], target: 9, dist: 4.5, phase: 2.5, shadow: false },
  { pos: [-HALF_W + 0.28, BOARD.y + BOARD.h / 2 + 0.14, BOARD.z], target: 10, dist: 5, phase: 3.3, shadow: false },
  { pos: [2.35, 1.05, 3.15], target: 4.5, dist: 3.8, phase: 0.9, shadow: false }
]

function Pendant({ position }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.22, 8]} />
        <meshStandardMaterial color="#1a1410" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.09, 0.12, 14]} />
        <meshStandardMaterial
          color="#3a2a18"
          roughness={0.45}
          metalness={0.25}
          emissive="#ffb366"
          emissiveIntensity={0.25}
        />
      </mesh>
    </group>
  )
}

export default function FlickerLights({ startedAt }) {
  const lightRefs = useRef([])
  const ambientRef = useRef()
  const flickerSent = useRef(false)
  const stableSent = useRef(false)
  const setPhase = useRoomStore((s) => s.setPhase)

  useIntroTick(startedAt, (t) => {
    const base = lightBase(t)
    LAMPS.forEach((lamp, i) => {
      const light = lightRefs.current[i]
      if (!light) return
      light.intensity = lamp.target * base * flickerFactor(t, lamp.phase)
    })
    if (ambientRef.current) {
      ambientRef.current.intensity = 0.012 + 0.045 * base
    }
    if (!flickerSent.current && t > 0.04) {
      flickerSent.current = true
      setPhase(ROOM_PHASE.LIGHTS_FLICKER)
    }
    if (!stableSent.current && t >= FLICKER_DURATION) {
      stableSent.current = true
      setPhase(ROOM_PHASE.LIGHTS_STABLE)
    }
  })

  return (
    <group>
      <ambientLight ref={ambientRef} intensity={0.012} color="#2a1c12" />
      <Pendant position={[0.05, ROOM_H - 0.18, 0.15]} />
      <Pendant position={[0.1, ROOM_H - 0.18, 1.85]} />
      {LAMPS.map((lamp, i) => (
        <pointLight
          key={i}
          ref={(el) => {
            lightRefs.current[i] = el
          }}
          position={lamp.pos}
          color="#ffb366"
          intensity={0}
          distance={lamp.dist}
          decay={2}
          castShadow={lamp.shadow}
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          shadow-bias={-0.012}
        />
      ))}
      <mesh position={[TABLE.x + 2.17, 0.92, 3.15]}>
        <cylinderGeometry args={[0.04, 0.05, 0.18, 10]} />
        <meshStandardMaterial color="#c4a056" emissive="#ffb366" emissiveIntensity={0.35} />
      </mesh>
    </group>
  )
}
