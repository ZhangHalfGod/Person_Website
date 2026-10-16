import React, { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { applyNamedMaterials, cloneGltf } from '@main/scene/gltfShared.js'
import { HALF_W, BOARD, PAINTING } from './roomLayout.js'
import FocusHit from './FocusHit.jsx'
import { assignLightMaps } from './bakeMaps.js'

/** Same ornate gold frame as left wall; scaled to BOARD opening. */
const FRAME_URL = '/models/picture_frame.glb?v=oc02c'
const LAMP_URL = '/models/picture_lamp.glb?v=bake1'

function frameMat(name, materials) {
  if (/Inner|Lip/i.test(name)) return materials.frameWoodLit
  if (/Outer|Corner|Leaf|Crest|Roundel/i.test(name)) return materials.goldDarkLit
  return materials.goldLit
}

export default function Blackboard({ materials }) {
  const { z, y, w, h } = BOARD
  const x = -HALF_W + 0.055
  const sx = w / PAINTING.w
  const sy = h / PAINTING.h

  const { scene: frameScene } = useGLTF(FRAME_URL)
  const { scene: lampScene } = useGLTF(LAMP_URL)
  const frame = useMemo(() => cloneGltf(frameScene), [frameScene])
  const lampA = useMemo(() => cloneGltf(lampScene), [lampScene])
  const lampB = useMemo(() => cloneGltf(lampScene), [lampScene])
  const frameRoot = useMemo(() => frame.getObjectByName('FrameRoot') || frame, [frame])
  const lampRootA = useMemo(
    () => lampA.getObjectByName('PictureLampRoot') || lampA.getObjectByName('LampRoot') || lampA,
    [lampA]
  )
  const lampRootB = useMemo(
    () => lampB.getObjectByName('PictureLampRoot') || lampB.getObjectByName('LampRoot') || lampB,
    [lampB]
  )
  const boardMat = useMemo(() => {
    const m = materials.boardWhite.clone()
    m.side = THREE.DoubleSide
    m.depthWrite = true
    return m
  }, [materials.boardWhite])

  useLayoutEffect(() => {
    assignLightMaps(frameRoot, [
      materials.frameWoodLit,
      materials.goldLit,
      materials.goldDarkLit,
      materials.brassFrameLit
    ])
    assignLightMaps(lampRootA, [materials.brassPicLampLit])
    assignLightMaps(lampRootB, [materials.brassPicLampLit])
    applyNamedMaterials(frameRoot, (name) => frameMat(name, materials))
    applyNamedMaterials(lampRootA, () => materials.brassPicLampLit)
    applyNamedMaterials(lampRootB, () => materials.brassPicLampLit)
  }, [frameRoot, lampRootA, lampRootB, materials])

  return (
    /*
      −X wall (screen-right): yaw −π/2 so local −Z faces into the room (+X),
      mirroring the left painting (yaw +π/2 → local −Z into room / −X).
    */
    <group position={[x, y, z]} rotation={[0, -Math.PI / 2, 0]} userData={{ id: 'blackboard' }}>
      <group scale={[sx, sy, 1]}>
        <primitive object={frameRoot} />
      </group>
      <mesh position={[0, 0, -0.066]} rotation={[0, Math.PI, 0]} material={boardMat} renderOrder={1}>
        <planeGeometry args={[w, h]} />
      </mesh>
      {/* Wide board: two picture lamps (v1-style dual wash). */}
      <group position={[-w * 0.28, h / 2 + 0.14, 0.02]}>
        <primitive object={lampRootA} />
      </group>
      <group position={[w * 0.28, h / 2 + 0.14, 0.02]}>
        <primitive object={lampRootB} />
      </group>
      <FocusHit focusId="blackboard" position={[0, 0, 0.04]} args={[w + 0.25, h + 0.4, 0.28]} />
    </group>
  )
}

useGLTF.preload(FRAME_URL)
useGLTF.preload(LAMP_URL)
