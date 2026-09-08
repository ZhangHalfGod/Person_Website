import React, { useLayoutEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { applyNamedMaterials, cloneGltf } from '@main/scene/gltfShared.js'
import { TABLE } from './roomLayout.js'

const TABLE_URL = '/models/table.glb'
const STOOL_URL = '/models/stool.glb'

function furnitureMat(name, materials) {
  if (/Rung/i.test(name)) return materials.furnitureDark
  return materials.furniture
}

function GltfProp({ url, materials, position, userData }) {
  const { scene } = useGLTF(url)
  const clone = useMemo(() => cloneGltf(scene), [scene])
  const root = useMemo(() => clone.getObjectByName('TableRoot') || clone.getObjectByName('StoolRoot') || clone, [clone])

  useLayoutEffect(() => {
    applyNamedMaterials(root, (name) => furnitureMat(name, materials))
  }, [root, materials])

  return (
    <group position={position} userData={userData}>
      <primitive object={root} />
    </group>
  )
}

export default function Furniture({ materials }) {
  const { x, z } = TABLE
  return (
    <group>
      <GltfProp url={TABLE_URL} materials={materials} position={[x, 0, z]} userData={{ id: 'table' }} />
      <GltfProp url={STOOL_URL} materials={materials} position={[x - 0.58, 0, z - 0.72]} userData={{ id: 'stool-1' }} />
      <GltfProp url={STOOL_URL} materials={materials} position={[x + 0.62, 0, z - 0.58]} userData={{ id: 'stool-2' }} />
      <GltfProp url={STOOL_URL} materials={materials} position={[x - 0.12, 0, z + 0.78]} userData={{ id: 'stool-3' }} />
    </group>
  )
}

useGLTF.preload(TABLE_URL)
useGLTF.preload(STOOL_URL)
