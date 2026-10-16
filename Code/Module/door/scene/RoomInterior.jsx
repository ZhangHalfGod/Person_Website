import React, { useLayoutEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { applyNamedMaterials, cloneGltf } from '@main/scene/gltfShared.js'
import {
  ROOM_W,
  ROOM_D,
  ROOM_H,
  WALL_T,
  WAINSCOT_H,
  HALF_W,
  HALF_D,
  DOOR_W,
  DOOR_H,
  DOOR_X
} from './roomLayout.js'

import { assignLightMaps } from './bakeMaps.js'

const COFFER_URL = '/models/ceiling_coffers.glb?v=c3b'
const SHELL_URL = '/models/room_shell.glb'

function cofferMaterial(name, materials) {
  // Emit first — name also contains "Panel"
  if (/SlotPanelEmit|SlotEmit/i.test(name)) return materials.skySlotEmit
  // C4 玻璃罩：挡板 + 口沿
  if (/SlotBaffle|SlotRim/i.test(name)) return materials.slotBaffle
  // 填心板 / 远排 → 大理石；梁 → 同石材略深
  if (/Fill|Panel/i.test(name)) return materials.ceilingLit
  return materials.beamLit
}

function shellMaterial(name, materials) {
  if (/Floor/i.test(name)) return materials.floorLit
  if (/Upper/i.test(name)) return materials.upperLit
  return materials.wainscotLit
}

function BakedShell({ materials }) {
  const { scene } = useGLTF(SHELL_URL)
  const clone = useMemo(() => cloneGltf(scene), [scene])

  useLayoutEffect(() => {
    assignLightMaps(clone, [materials.floorLit, materials.wainscotLit, materials.upperLit])
    applyNamedMaterials(clone, (name) => shellMaterial(name, materials), { raycast: false })
  }, [clone, materials])

  return <primitive object={clone} />
}

function WallPanel({ position, size, material, receiveShadow = true }) {
  return (
    <mesh position={position} receiveShadow={receiveShadow} material={material}>
      <boxGeometry args={size} />
    </mesh>
  )
}

function CofferedCeiling({ materials }) {
  const { scene } = useGLTF(COFFER_URL)
  const clone = useMemo(() => cloneGltf(scene), [scene])
  const root = useMemo(() => clone.getObjectByName('CofferRoot') || clone, [clone])

  useLayoutEffect(() => {
    // Emit / 玻璃罩不挂 LM；仅梁与填心吃 coffer LM（C3b 前强度保守）
    assignLightMaps(root, [materials.ceilingLit, materials.beamLit])
    applyNamedMaterials(root, (name) => cofferMaterial(name, materials))
    root.traverse((obj) => {
      if (!obj.isMesh) return
      if (/SlotPanelEmit|SlotEmit|SlotBaffle|SlotRim/i.test(obj.name)) {
        obj.castShadow = false
        obj.receiveShadow = false
      }
    })
  }, [root, materials])

  return (
    <group position={[0, ROOM_H, 0]}>
      <primitive object={root} />
    </group>
  )
}

function DoorWall({ materials }) {
  const gapLeft = DOOR_X - DOOR_W / 2
  const gapRight = DOOR_X + DOOR_W / 2
  const leftW = gapLeft - (-HALF_W)
  const rightW = HALF_W - gapRight
  const leftX = -HALF_W + leftW / 2
  const rightX = gapRight + rightW / 2
  const upperH = ROOM_H - DOOR_H
  const z = -HALF_D - WALL_T / 2
  const wainscotTop = Math.min(WAINSCOT_H, DOOR_H)

  return (
    <group>
      <WallPanel
        position={[leftX, wainscotTop / 2, z]}
        size={[leftW, wainscotTop, WALL_T]}
        material={materials.wainscot}
      />
      <WallPanel
        position={[leftX, WAINSCOT_H + (ROOM_H - WAINSCOT_H) / 2, z]}
        size={[leftW, ROOM_H - WAINSCOT_H, WALL_T]}
        material={materials.upperWall}
        receiveShadow={false}
      />
      <WallPanel
        position={[rightX, wainscotTop / 2, z]}
        size={[rightW, wainscotTop, WALL_T]}
        material={materials.wainscot}
      />
      <WallPanel
        position={[rightX, WAINSCOT_H + (ROOM_H - WAINSCOT_H) / 2, z]}
        size={[rightW, ROOM_H - WAINSCOT_H, WALL_T]}
        material={materials.upperWall}
        receiveShadow={false}
      />
      <WallPanel
        position={[DOOR_X, DOOR_H + upperH / 2, z]}
        size={[DOOR_W + 0.04, upperH, WALL_T]}
        material={materials.upperWall}
        receiveShadow={false}
      />
      <mesh position={[DOOR_X, DOOR_H / 2, -HALF_D - 0.08]} material={materials.voidMat}>
        <boxGeometry args={[DOOR_W, DOOR_H, 0.06]} />
      </mesh>
    </group>
  )
}

export default function RoomInterior({ materials }) {
  return (
    <group>
      <BakedShell materials={materials} />
      <mesh position={[0, ROOM_H, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.ceiling}>
        <planeGeometry args={[ROOM_W + WALL_T * 2, ROOM_D + WALL_T * 2]} />
      </mesh>
      <CofferedCeiling materials={materials} />
      <DoorWall materials={materials} />
    </group>
  )
}

useGLTF.preload(COFFER_URL)
useGLTF.preload(SHELL_URL)
