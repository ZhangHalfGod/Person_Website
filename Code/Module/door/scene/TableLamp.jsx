import React, { useLayoutEffect, useMemo, useRef } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { cloneGltf } from '@main/scene/gltfShared.js'
import { TABLE_LAMP } from './roomLayout.js'
import { flickerFactor, lightBase } from './introTimeline.js'
import { MAX_PUSH } from './roomCameraStops.js'
import { useRoomStore } from '../store/roomStore.js'
import { useIntroTick } from './useIntroTick.js'
import { lightChannel } from './bakeMaps.js'

/** Poly Haven desk_lamp_arm_01 (CC0) + Bake1 UV2 lightmap/AO. */
const LAMP_URL = '/models/table_lamp.glb?v=ph-bake1'
const LAMP_TARGET = 2.4
const LAMP_SCALE = 1
const BULB_LOCAL = [0, 0.4, 0.1]

function prepBake(tex) {
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.flipY = false
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  tex.needsUpdate = true
  return tex
}

export default function TableLamp({ startedAt }) {
  const { scene } = useGLTF(LAMP_URL)
  const bakeMaps = useTexture({
    light: '/textures/door/table_lamp_lightmap.jpg',
    ao: '/textures/door/table_lamp_ao.jpg'
  })
  const root = useMemo(() => {
    const clone = cloneGltf(scene)
    clone.position.set(0, 0, 0)
    clone.rotation.set(0, 0, 0)
    clone.scale.set(1, 1, 1)
    return clone
  }, [scene])
  const lightRef = useRef()
  const emissiveMats = useRef([])
  const toggleTableLamp = useRoomStore((s) => s.toggleTableLamp)
  const advanceFocus = useRoomStore((s) => s.advanceFocus)

  useLayoutEffect(() => {
    prepBake(bakeMaps.light)
    prepBake(bakeMaps.ao)
    const mats = []
    let channel = 2
    root.traverse((obj) => {
      if (!obj.isMesh || !obj.geometry) return
      channel = lightChannel(obj.geometry) || channel
    })
    bakeMaps.light.channel = channel
    bakeMaps.ao.channel = channel

    root.traverse((obj) => {
      if (!obj.isMesh) return
      obj.castShadow = true
      obj.receiveShadow = true
      const list = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const mat of list) {
        if (!mat) continue
        mat.lightMap = bakeMaps.light
        mat.aoMap = bakeMaps.ao
        mat.lightMapIntensity = 0.42
        mat.aoMapIntensity = 0.58
        mat.envMapIntensity = 1.1
        if (mat.map) {
          mat.map.anisotropy = 8
          mat.map.needsUpdate = true
        }
        if (mat.normalMap) {
          mat.normalMap.anisotropy = 8
          mat.normalMap.needsUpdate = true
        }
        mat.needsUpdate = true
        if (mat.emissiveIntensity != null && /light/i.test(mat.name || '')) {
          mats.push(mat)
        }
      }
    })
    emissiveMats.current = mats
  }, [root, bakeMaps])

  useIntroTick(startedAt, (t) => {
    const on = useRoomStore.getState().tableLampOn ? 1 : 0
    const intro = lightBase(t) * flickerFactor(t, 0.72)
    const mul = intro * on
    if (lightRef.current) lightRef.current.intensity = LAMP_TARGET * mul
    for (const mat of emissiveMats.current) {
      mat.emissiveIntensity = 1.2 * mul
    }
  })

  return (
    <group
      position={[TABLE_LAMP.x, TABLE_LAMP.y, TABLE_LAMP.z]}
      rotation={[0, TABLE_LAMP.rotY || 0, 0]}
      scale={LAMP_SCALE}
      userData={{ id: 'table-lamp' }}
    >
      <primitive object={root} />
      <mesh
        name="LampFocusHit"
        position={[0, 0.26, 0]}
        onClick={(e) => {
          e.stopPropagation()
          const s = useRoomStore.getState()
          if (s.focus === 'lamp' && s.zoom >= MAX_PUSH) toggleTableLamp()
          else advanceFocus('lamp')
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
        }}
      >
        <boxGeometry args={[0.36, 0.62, 0.4]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <pointLight
        ref={lightRef}
        position={BULB_LOCAL}
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
