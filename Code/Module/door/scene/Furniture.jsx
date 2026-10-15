import React, { useLayoutEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { applyNamedMaterials, cloneGltf } from '@main/scene/gltfShared.js'
import { HALF_D, TABLE } from './roomLayout.js'
import FocusHit from './FocusHit.jsx'
import { assignLightMaps } from './bakeMaps.js'

const TABLE_URL = '/models/table.glb?v=bake1'
const STOOL_URL = '/models/stool.glb?v=bake1'
const BOOKCASE_URL = '/models/bookcase.glb?v=bake1'

function tableMat(_name, materials) {
  return materials.tableLit
}

function stoolMat(name, materials) {
  if (/Rung/i.test(name)) return materials.stoolDarkLit
  return materials.stoolLit
}

function bookcaseMat(name, materials) {
  if (/Book/i.test(name)) return materials.bookcaseDarkLit
  return materials.bookcaseLit
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
  const bookLit = [materials.bookcaseLit, materials.bookcaseDarkLit]

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
        <FocusHit focusId="bookcase" position={[0, 1.25, -0.15]} args={[1.1, 2.4, 0.55]} />
      </group>
    </group>
  )
}

useGLTF.preload(TABLE_URL)
useGLTF.preload(STOOL_URL)
useGLTF.preload(BOOKCASE_URL)
