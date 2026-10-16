import React, { useLayoutEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { applyNamedMaterials, cloneGltf } from '@main/scene/gltfShared.js'
import { HALF_D, TABLE } from './roomLayout.js'
import FocusHit from './FocusHit.jsx'
import { assignLightMaps } from './bakeMaps.js'

const TABLE_URL = '/models/table.glb?v=oc02'
const STOOL_URL = '/models/stool.glb?v=bake1'
const BOOKCASE_URL = '/models/bookcase.glb?v=oc03'

function tableMat(_name, materials) {
  return materials.tableLit
}

function stoolMat(name, materials) {
  if (/Rung/i.test(name)) return materials.stoolDarkLit
  return materials.stoolLit
}

function bookcaseMat(name, materials) {
  if (/Book/i.test(name)) {
    const n = Number.parseInt(String(name).replace(/\D/g, ''), 10) || 0
    if (n % 3 === 1) return materials.bookcaseBookMid
    if (n % 3 === 2) return materials.bookcaseBookDeep
    return materials.bookcaseDarkLit
  }
  return materials.bookcaseLit
}

/**
 * OC-03: 1–2 weak warm points inside the case — spines only, no flicker.
 * Intensity kept low vs bookcase LM to avoid double-count wash.
 */
function BookcaseAccentLights() {
  return (
    <group>
      {/* Upper shelves — narrow reach */}
      <pointLight
        position={[0.05, 1.62, -0.1]}
        color="#ffb366"
        intensity={1.15}
        distance={1.35}
        decay={2}
        castShadow={false}
      />
      {/* Mid / lower spines */}
      <pointLight
        position={[-0.08, 0.92, -0.12]}
        color="#ff9a55"
        intensity={0.85}
        distance={1.15}
        decay={2}
        castShadow={false}
      />
    </group>
  )
}

function GltfProp({ url, materials, pickMaterial, litMaterials, position, userData }) {
  const { scene } = useGLTF(url)
  const clone = useMemo(() => cloneGltf(scene), [scene])
  const root = useMemo(
    () =>
      clone.getObjectByName('TableRoot') ||
      clone.getObjectByName('StoolRoot') ||
      clone.getObjectByName('BookcaseRoot') ||
      clone,
    [clone]
  )

  useLayoutEffect(() => {
    assignLightMaps(root, litMaterials)
    applyNamedMaterials(root, (name) => pickMaterial(name, materials))
  }, [root, materials, pickMaterial, litMaterials])

  return (
    <group position={position} userData={userData}>
      <primitive object={root} />
    </group>
  )
}

export default function Furniture({ materials }) {
  const { x, z } = TABLE
  const tableLit = [materials.tableLit]
  const stoolLit = [materials.stoolLit, materials.stoolDarkLit]
  const bookLit = [
    materials.bookcaseLit,
    materials.bookcaseDarkLit,
    materials.bookcaseBookMid,
    materials.bookcaseBookDeep
  ]

  return (
    <group>
      <GltfProp
        url={TABLE_URL}
        materials={materials}
        pickMaterial={tableMat}
        litMaterials={tableLit}
        position={[x, 0, z]}
        userData={{ id: 'table' }}
      />
      <GltfProp
        url={STOOL_URL}
        materials={materials}
        pickMaterial={stoolMat}
        litMaterials={stoolLit}
        position={[x - 0.58, 0, z - 0.72]}
        userData={{ id: 'stool-1' }}
      />
      <GltfProp
        url={STOOL_URL}
        materials={materials}
        pickMaterial={stoolMat}
        litMaterials={stoolLit}
        position={[x + 0.62, 0, z - 0.58]}
        userData={{ id: 'stool-2' }}
      />
      <GltfProp
        url={STOOL_URL}
        materials={materials}
        pickMaterial={stoolMat}
        litMaterials={stoolLit}
        position={[x - 0.12, 0, z + 0.78]}
        userData={{ id: 'stool-3' }}
      />
      <group position={[1.85, 0, HALF_D - 0.22]} userData={{ id: 'bookcase' }}>
        <GltfProp
          url={BOOKCASE_URL}
          materials={materials}
          pickMaterial={bookcaseMat}
          litMaterials={bookLit}
          position={[0, 0, 0]}
        />
        <BookcaseAccentLights />
        <FocusHit focusId="bookcase" position={[0, 1.25, -0.15]} args={[1.1, 2.4, 0.55]} />
      </group>
    </group>
  )
}

useGLTF.preload(TABLE_URL)
useGLTF.preload(STOOL_URL)
useGLTF.preload(BOOKCASE_URL)
