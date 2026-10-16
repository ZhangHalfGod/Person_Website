import React, { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { useHelper } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { HALF_W, PAINTING, BOARD, ROOM_H } from './roomLayout.js'
import { FLICKER_DURATION, flickerFactor, lightBase } from './introTimeline.js'
import { ROOM_PHASE, useRoomStore } from '../store/roomStore.js'
import { useIntroTick } from './useIntroTick.js'

/**
 * C4 + C3c–C3e：四槽主照（Spot + Point 补光）；无锥灯 CEILING / FanPendant。
 * C3e：强度在子组件 useFrame 直写，避免 intensity={0} 被 React 重渲染盖掉。
 */
const SLOT_LIGHTS = [
  { pos: [-1.1, ROOM_H - 0.06, 1.7], peak: 92, stable: 72, dist: 9.5, angle: 0.78, penumbra: 0.58, phase: 0.2, pointStable: 16, pointPeak: 22 },
  { pos: [1.1, ROOM_H - 0.06, 1.7], peak: 88, stable: 68, dist: 9.2, angle: 0.78, penumbra: 0.6, phase: 0.7, pointStable: 15, pointPeak: 20 },
  { pos: [-1.1, ROOM_H - 0.06, -0.1], peak: 90, stable: 70, dist: 9.5, angle: 0.8, penumbra: 0.6, phase: 1.3, pointStable: 16, pointPeak: 21 },
  { pos: [1.1, ROOM_H - 0.06, -0.1], peak: 84, stable: 64, dist: 9.2, angle: 0.8, penumbra: 0.62, phase: 1.9, pointStable: 14, pointPeak: 19 }
]

/** DEV：锥体 helper 默认关；控制台 `window.__slotLightHelpers = true` 后刷新可开 */
const SHOW_SLOT_HELPERS =
  import.meta.env.DEV && typeof window !== 'undefined' && window.__slotLightHelpers === true

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
  // C3e 验证：压低地板 LM，露出 live 槽光灯塘（不重烤）
  floorLit: 0.2,
  wainscotLit: 0.5,
  upperLit: 0.26,
  tableLit: 0.72,
  stoolLit: 0.68,
  stoolDarkLit: 0.52,
  bookcaseLit: 0.65,
  bookcaseDarkLit: 0.34,
  bookcaseBookMid: 0.38,
  bookcaseBookDeep: 0.28,
  brassFrameLit: 0.62,
  brassPicLampLit: 0.55,
  brassTableLampLit: 0.5,
  goldLit: 0.64,
  goldDarkLit: 0.55,
  frameWoodLit: 0.5,
  lampShadeOuterLit: 0.48,
  beamLit: 0.4,
  ceilingLit: 0.36
}
const BAKE_UNDER = 0.2
const LIT_KEYS = Object.keys(BAKE_FULL)

/** 父级每 tick 写入；子组件 useFrame 读出并落到 Three 对象 */
function SlotDownSpot({ lamp, index, spotIRef, pointIRef }) {
  const spotRef = useRef(null)
  const pointRef = useRef(null)
  const targetRef = useRef(null)
  const logAcc = useRef(0)

  useHelper(SHOW_SLOT_HELPERS ? spotRef : null, THREE.SpotLightHelper, '#7ec8ff')

  useLayoutEffect(() => {
    const spot = spotRef.current
    const target = targetRef.current
    if (!spot || !target) return
    spot.target = target
    target.position.set(lamp.pos[0], 0.05, lamp.pos[2])
    target.updateMatrixWorld(true)
    // 默认先落到 stable，避免首帧黑
    spot.intensity = lamp.stable
    if (pointRef.current) pointRef.current.intensity = lamp.pointStable
  }, [lamp])

  useFrame((_, dt) => {
    const spot = spotRef.current
    const point = pointRef.current
    const target = targetRef.current
    if (!spot || !target) return

    target.position.set(lamp.pos[0], 0.05, lamp.pos[2])
    if (spot.target !== target) spot.target = target
    target.updateMatrixWorld(true)

    // C3e：强度只在这里写本地 ref，不被 JSX intensity={0} 盖掉
    const si = spotIRef.current[index]
    const pi = pointIRef.current[index]
    if (typeof si === 'number') spot.intensity = si
    if (point && typeof pi === 'number') point.intensity = pi

    if (import.meta.env.DEV) {
      logAcc.current += dt
      if (logAcc.current > 1.5 && index === 0) {
        logAcc.current = 0
        const vals = SLOT_LIGHTS.map((_, i) => {
          const s = spotIRef.current[i]
          return typeof s === 'number' ? s.toFixed(1) : '?'
        })
        // eslint-disable-next-line no-console
        console.debug('[C3e slot intensity]', vals.join(', '), 'spot0=', spot.intensity.toFixed(1), 'point0=', point?.intensity?.toFixed(1))
        if (typeof window !== 'undefined') {
          window.__slotSpotI = vals
          window.__slotPointI = SLOT_LIGHTS.map((_, i) => {
            const p = pointIRef.current[i]
            return typeof p === 'number' ? p.toFixed(1) : '?'
          })
        }
      }
    }
  })

  return (
    <group>
      <object3D ref={targetRef} position={[lamp.pos[0], 0.05, lamp.pos[2]]} />
      <spotLight
        ref={spotRef}
        position={lamp.pos}
        color="#e4eef8"
        intensity={lamp.stable}
        distance={lamp.dist}
        decay={1.5}
        angle={lamp.angle}
        penumbra={lamp.penumbra}
        castShadow={false}
      />
      {/* C3e A/B：同槽 Point 补光；Point 出塘而 Spot 无 → 保留 Point */}
      <pointLight
        ref={pointRef}
        position={lamp.pos}
        color="#e4eef8"
        intensity={lamp.pointStable}
        distance={8}
        decay={2}
        castShadow={false}
      />
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
        intensity={lamp.stable}
        distance={lamp.dist}
        decay={2}
        angle={lamp.angle}
        penumbra={lamp.penumbra}
      />
    </group>
  )
}

export default function FlickerLights({ startedAt, materials }) {
  const spotIRef = useRef(SLOT_LIGHTS.map((l) => l.stable))
  const pointIRef = useRef(SLOT_LIGHTS.map((l) => l.pointStable))
  const washRefs = useRef([])
  const washTargets = useRef([])
  const ambientRef = useRef()
  const flickerSent = useRef(false)
  const stableSent = useRef(false)
  const setPhase = useRoomStore((s) => s.setPhase)

  useIntroTick(startedAt, (t) => {
    const base = lightBase(t)
    const settle = Math.min(1, Math.max(0, (t - (FLICKER_DURATION - 2.2)) / 2.2))

    SLOT_LIGHTS.forEach((lamp, i) => {
      const live = lamp.peak + (lamp.stable - lamp.peak) * settle
      const mul = base * (0.75 + 0.25 * flickerFactor(t, lamp.phase))
      spotIRef.current[i] = live * mul
      const pLive = lamp.pointPeak + (lamp.pointStable - lamp.pointPeak) * settle
      pointIRef.current[i] = pLive * mul
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
      ambientRef.current.intensity = 0.025 + 0.08 * settle * base
    }
    if (materials) {
      const mix = BAKE_UNDER + (1 - BAKE_UNDER) * settle
      LIT_KEYS.forEach((key) => {
        const mat = materials[key]
        if (mat) mat.lightMapIntensity = (BAKE_FULL[key] || 0.7) * mix
      })
      if (materials.skySlotEmit) {
        materials.skySlotEmit.emissiveIntensity = 0.5 + 1.2 * settle * base
      }
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
      <ambientLight ref={ambientRef} intensity={0.025} color="#1c1814" />
      {SLOT_LIGHTS.map((lamp, i) => (
        <SlotDownSpot key={`slot${i}`} lamp={lamp} index={i} spotIRef={spotIRef} pointIRef={pointIRef} />
      ))}
      {WASH.map((lamp, i) => (
        <WashSpot key={`w${i}`} lamp={lamp} index={i} lightRefs={washRefs} targetRefs={washTargets} />
      ))}
    </group>
  )
}
