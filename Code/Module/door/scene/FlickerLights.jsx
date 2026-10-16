import React, { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three' // LatheGeometry / Vector2
import { HALF_W, PAINTING, BOARD, ROOM_H } from './roomLayout.js'
import { FLICKER_DURATION, flickerFactor, lightBase } from './introTimeline.js'
import { ROOM_PHASE, useRoomStore } from '../store/roomStore.js'
import { useIntroTick } from './useIntroTick.js'

/**
 * Goal3 lighting:
 * - Ceiling: PointLights (stable residual low) + floor lightMap for soft pools
 * - Picture/board: SpotLights with high penumbra for soft wash
 * - No gray hemi/dir fill (see RoomScene)
 */
const CEILING = [
  { pos: [0.05, ROOM_H - 0.22, 0.15], peak: 22, stable: 15, dist: 9.5, phase: 0.2, shadow: true },
  { pos: [0.1, ROOM_H - 0.28, 1.85], peak: 16, stable: 11.5, dist: 8.5, phase: 1.4, shadow: false },
  // Soft mid fill — table/floor readable without cool gray hemi
  { pos: [0.08, ROOM_H - 0.55, 1.0], peak: 7, stable: 4.2, dist: 7.5, phase: 0.8, shadow: false }
]

const WASH = [
  {
    pos: [HALF_W - 0.18, PAINTING.y + PAINTING.h / 2 + 0.22, PAINTING.z],
    look: [HALF_W - 0.05, PAINTING.y - 0.05, PAINTING.z],
    peak: 14,
    stable: 9,
    dist: 3.4,
    angle: 0.72,
    penumbra: 0.88,
    phase: 2.5
  },
  {
    pos: [-HALF_W + 0.18, BOARD.y + BOARD.h / 2 + 0.2, BOARD.z],
    look: [-HALF_W + 0.05, BOARD.y - 0.04, BOARD.z],
    peak: 15,
    stable: 9.5,
    dist: 3.8,
    angle: 0.78,
    penumbra: 0.9,
    phase: 3.3
  }
]

const BAKE_FULL = {
  // OC-01 dual-ellipse rebake — slightly lower to limit live+LM double-count
  floorLit: 1.18,
  wainscotLit: 0.58,
  upperLit: 0.3,
  tableLit: 0.85,
  stoolLit: 0.78,
  stoolDarkLit: 0.6,
  // OC-03: shelves a bit more open; books stay darker (accent lights add spine read)
  bookcaseLit: 0.72,
  bookcaseDarkLit: 0.38,
  bookcaseBookMid: 0.42,
  bookcaseBookDeep: 0.32,
  brassFrameLit: 0.68,
  brassPicLampLit: 0.6,
  brassTableLampLit: 0.55,
  goldLit: 0.7,
  goldDarkLit: 0.6,
  frameWoodLit: 0.55,
  lampShadeOuterLit: 0.52,
  beamLit: 0.48,
  ceilingLit: 0.32
}
const BAKE_UNDER = 0.2
const LIT_KEYS = Object.keys(BAKE_FULL)

function fanShadeGeometry() {
  const pts = []
  for (let i = 0; i <= 12; i += 1) {
    const t = i / 12
    const y = -0.02 + t * 0.13
    const radius = 0.108 * (1 - t) ** 0.85 + 0.028
    pts.push(new THREE.Vector2(radius, y))
  }
  return new THREE.LatheGeometry(pts, 36)
}

function FanPendant({ position }) {
  const shade = useMemo(() => fanShadeGeometry(), [])
  return (
    <group position={position}>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.2, 8]} />
        <meshStandardMaterial color="#1a1410" roughness={0.8} />
      </mesh>
      <mesh geometry={shade} position={[0, -0.02, 0]}>
        <meshStandardMaterial
          color="#3a2a18"
          roughness={0.48}
          metalness={0.22}
          emissive="#ffb366"
          emissiveIntensity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.058, 0.035, Math.sin(a) * 0.058]} rotation={[0, -a, 0]}>
            <boxGeometry args={[0.006, 0.09, 0.014]} />
            <meshStandardMaterial color="#2a2118" roughness={0.42} metalness={0.35} />
          </mesh>
        )
      })}
    </group>
  )
}

function WashSpot({ lamp, index, lightRefs, targetRefs }) {
  useLayoutEffect(() => {
    const light = lightRefs.current[index]
    const target = targetRefs.current[index]
    if (light && target) {
      light.target = target
      target.updateMatrixWorld()
    }
  })

  return (
    <group>
      <object3D
        ref={(el) => {
          targetRefs.current[index] = el
        }}
        position={lamp.look}
      />
      <spotLight
        ref={(el) => {
          lightRefs.current[index] = el
        }}
        position={lamp.pos}
        color="#ffc27a"
        intensity={0}
        distance={lamp.dist}
        decay={2}
        angle={lamp.angle}
        penumbra={lamp.penumbra}
      />
    </group>
  )
}

export default function FlickerLights({ startedAt, materials }) {
  const ceilRefs = useRef([])
  const washRefs = useRef([])
  const washTargets = useRef([])
  const ambientRef = useRef()
  const flickerSent = useRef(false)
  const stableSent = useRef(false)
  const setPhase = useRoomStore((s) => s.setPhase)

  useIntroTick(startedAt, (t) => {
    const base = lightBase(t)
    const settle = Math.min(1, Math.max(0, (t - (FLICKER_DURATION - 2.2)) / 2.2))
    CEILING.forEach((lamp, i) => {
      const light = ceilRefs.current[i]
      if (!light) return
      const live = lamp.peak + (lamp.stable - lamp.peak) * settle
      light.intensity = live * base * flickerFactor(t, lamp.phase)
    })
    WASH.forEach((lamp, i) => {
      const light = washRefs.current[i]
      const target = washTargets.current[i]
      if (!light) return
      if (target && light.target !== target) light.target = target
      if (light.target) light.target.updateMatrixWorld()
      const live = lamp.peak + (lamp.stable - lamp.peak) * settle
      light.intensity = live * base * flickerFactor(t, lamp.phase)
    })
    if (ambientRef.current) {
      ambientRef.current.intensity = 0.012 + 0.035 * base
    }
    if (materials) {
      const mix = BAKE_UNDER + (1 - BAKE_UNDER) * settle
      LIT_KEYS.forEach((key) => {
        const mat = materials[key]
        if (mat) mat.lightMapIntensity = (BAKE_FULL[key] || 0.7) * mix
      })
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
      <ambientLight ref={ambientRef} intensity={0.012} color="#1c140e" />
      <FanPendant position={[0.05, ROOM_H - 0.18, 0.15]} />
      <FanPendant position={[0.1, ROOM_H - 0.18, 1.85]} />
      {CEILING.map((lamp, i) => (
        <pointLight
          key={`c${i}`}
          ref={(el) => {
            ceilRefs.current[i] = el
          }}
          position={lamp.pos}
          color={i === 2 ? '#ff9a55' : '#ffb366'}
          intensity={0}
          distance={lamp.dist}
          decay={2}
          castShadow={lamp.shadow}
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          shadow-bias={-0.012}
        />
      ))}
      {WASH.map((lamp, i) => (
        <WashSpot key={`w${i}`} lamp={lamp} index={i} lightRefs={washRefs} targetRefs={washTargets} />
      ))}
    </group>
  )
}
