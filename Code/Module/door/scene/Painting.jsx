import React, { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { applyNamedMaterials, cloneGltf } from '@main/scene/gltfShared.js'
import { HALF_W, PAINTING } from './roomLayout.js'
import FocusHit from './FocusHit.jsx'
import PaintingEmbed from './PaintingEmbed.jsx'
import { assignLightMaps } from './bakeMaps.js'

const FRAME_URL = '/models/picture_frame.glb?v=oc02c'
const LAMP_URL = '/models/picture_lamp.glb?v=bake1'

function frameMat(name, materials) {
  // Rim moldings only; canvas is a separate white plane in the opening.
  if (/Inner|Lip/i.test(name)) return materials.frameWoodLit
  if (/Outer|Corner|Leaf|Crest|Roundel/i.test(name)) return materials.goldDarkLit
  return materials.goldLit
}

export default function Painting({ materials }) {
  const { z, y, w, h } = PAINTING
  const x = HALF_W - 0.055
  const { scene: frameScene } = useGLTF(FRAME_URL)
  const { scene: lampScene } = useGLTF(LAMP_URL)
  const frame = useMemo(() => cloneGltf(frameScene), [frameScene])
  const lamp = useMemo(() => cloneGltf(lampScene), [lampScene])
  const frameRoot = useMemo(() => frame.getObjectByName('FrameRoot') || frame, [frame])
  const lampRoot = useMemo(
    () => lamp.getObjectByName('PictureLampRoot') || lamp.getObjectByName('LampRoot') || lamp,
    [lamp]
  )
  const canvasMat = useMemo(() => {
    const m = materials.canvasWhite.clone()
    m.side = THREE.DoubleSide
    m.depthWrite = true
    return m
  }, [materials.canvasWhite])

  useLayoutEffect(() => {
    assignLightMaps(frameRoot, [
      materials.frameWoodLit,
      materials.goldLit,
      materials.goldDarkLit,
      materials.brassFrameLit
    ])
    assignLightMaps(lampRoot, [materials.brassPicLampLit])
    applyNamedMaterials(frameRoot, (name) => frameMat(name, materials))
    applyNamedMaterials(lampRoot, () => materials.brassPicLampLit)
  }, [frameRoot, lampRoot, materials])

  return (
    <group position={[x, y, z]} rotation={[0, Math.PI / 2, 0]} userData={{ id: 'painting' }}>
      <primitive object={frameRoot} />
      {/*
        Parent yaw = π/2: local −Z faces into the room (−X).
        Frame depth was Blender +Y → glTF −Z; lip front ≈ −0.06.
        Canvas / embed sit on the room side (negative Z), not into the wall (+Z).
      */}
      {/* Fallback plate behind iframe (loads / blocked); slightly deeper than Html. */}
      <mesh position={[0, 0, -0.066]} rotation={[0, Math.PI, 0]} material={canvasMat} renderOrder={1}>
        <planeGeometry args={[w, h]} />
      </mesh>
      {/* M2: iframe aligned to opening UV (PAINTING.w×h). FocusHit rim still advances camera. */}
      <PaintingEmbed
        width={w}
        height={h}
        position={[0, 0, -0.07]}
        rotation={[0, Math.PI, 0]}
      />
      <group position={[0, h / 2 + 0.14, 0.02]}>
        <primitive object={lampRoot} />
      </group>
      {/* Hit volume larger than opening → rim clicks push-in; opening DOM keeps iframe scroll/click. */}
      <FocusHit focusId="painting" position={[0, 0, 0.04]} args={[w + 0.2, h + 0.35, 0.22]} />
    </group>
  )
}

useGLTF.preload(FRAME_URL)
useGLTF.preload(LAMP_URL)
