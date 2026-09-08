import React, { useLayoutEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { applyNamedMaterials, cloneGltf } from '@main/scene/gltfShared.js'
import { TABLE, TABLE_LAMP } from './roomLayout.js'
import { flickerFactor, lightBase } from './introTimeline.js'
import { useRoomStore } from '../store/roomStore.js'
import { useIntroTick } from './useIntroTick.js'

const LAMP_URL = '/models/table_lamp.glb'
const LAMP_TARGET = 9.5
const LAMP_SCALE = 1.32
const CORD_LOCAL = [0.048, 0.14, 0]

function lampMat(name, materials) {
  if (/ShadeInner/i.test(name)) return materials.lampShadeInner
  if (/Rib|Knurl|Disc|Stem|Ferrule|Socket|Cap|Rim|Bead|Base|Step/i.test(name)) {
    return materials.brass
  }
  if (/Shade/i.test(name)) return materials.lampShadeOuter
  if (/PullCord|Cord/i.test(name)) return materials.lampCord
  if (/Bulb/i.test(name)) return materials.lampBulb
  return materials.brass
}

function isPull(name) {
  return /Pull/i.test(name)
}

export default function TableLamp({ materials, startedAt }) {
  const { scene } = useGLTF(LAMP_URL)
  const clone = useMemo(() => cloneGltf(scene), [scene])
  const root = useMemo(
    () => clone.getObjectByName('LampRoot') || clone.getObjectByName('LampRoot.001') || clone,
    [clone]
  )
  const lightRef = useRef()
  const bulbRef = useRef()
  const innerRef = useRef()
  const toggleTableLamp = useRoomStore((s) => s.toggleTableLamp)

  useLayoutEffect(() => {
    applyNamedMaterials(root, (name) => lampMat(name, materials))
    root.traverse((obj) => {
      if (!obj.isMesh) return
      if (/Bulb/i.test(obj.name)) bulbRef.current = obj
      if (/ShadeInner|Inner/i.test(obj.name)) innerRef.current = obj
      if (!isPull(obj.name)) obj.raycast = () => {}
    })
  }, [root, materials])

  useIntroTick(startedAt, (t) => {
    const on = useRoomStore.getState().tableLampOn ? 1 : 0
    const intro = lightBase(t) * flickerFactor(t, 0.72)
    const mul = intro * on
    if (lightRef.current) lightRef.current.intensity = LAMP_TARGET * mul
    if (bulbRef.current?.material) {
      bulbRef.current.material.emissiveIntensity = 1.4 * mul
    }
    if (innerRef.current?.material) {
      innerRef.current.material.emissiveIntensity = 0.55 * mul
    }
  })

  return (
    <group position={[TABLE_LAMP.x, TABLE.h, TABLE_LAMP.z]} scale={LAMP_SCALE} userData={{ id: 'table-lamp' }}>
      <primitive object={root} />
      <mesh
        name="PullCordHit"
        position={CORD_LOCAL}
        onClick={(e) => {
          e.stopPropagation()
          toggleTableLamp()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
        }}
      >
        <cylinderGeometry args={[0.05, 0.05, 0.32, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, 0.22, 0]}
        color="#ffb366"
        intensity={0}
        distance={4.6}
        decay={2}
        castShadow={false}
      />
    </group>
  )
}

useGLTF.preload(LAMP_URL)
