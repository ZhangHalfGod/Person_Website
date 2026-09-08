import React, { useLayoutEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { applyNamedMaterials, cloneGltf } from '@main/scene/gltfShared.js'
import { HALF_W, PAINTING } from './roomLayout.js'

const FRAME_URL = '/models/picture_frame.glb'
const LAMP_URL = '/models/picture_lamp.glb'

function frameMat(name, materials) {
  if (/Inner/i.test(name)) return materials.frameWood
  if (/Outer|Corner/i.test(name)) return materials.goldDark
  return materials.gold
}

export default function Painting({ materials }) {
  const { z, y, w, h } = PAINTING
  const x = HALF_W - 0.055
  const { scene: frameScene } = useGLTF(FRAME_URL)
  const { scene: lampScene } = useGLTF(LAMP_URL)
  const frame = useMemo(() => cloneGltf(frameScene), [frameScene])
  const lamp = useMemo(() => cloneGltf(lampScene), [lampScene])
  const frameRoot = useMemo(() => frame.getObjectByName('FrameRoot') || frame, [frame])
  const lampRoot = useMemo(() => lamp.getObjectByName('LampRoot') || lamp, [lamp])

  useLayoutEffect(() => {
    applyNamedMaterials(frameRoot, (name) => frameMat(name, materials))
    applyNamedMaterials(lampRoot, () => materials.brass)
  }, [frameRoot, lampRoot, materials])

  return (
    <group position={[x, y, z]} rotation={[0, Math.PI / 2, 0]} userData={{ id: 'painting' }}>
      <primitive object={frameRoot} />
      <mesh position={[0, 0, -0.055]} rotation={[0, Math.PI, 0]} material={materials.canvasWhite}>
        <planeGeometry args={[w, h]} />
      </mesh>
      <group position={[0, h / 2 + 0.14, 0.02]}>
        <primitive object={lampRoot} />
      </group>
    </group>
  )
}

useGLTF.preload(FRAME_URL)
useGLTF.preload(LAMP_URL)
