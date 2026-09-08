/** Clone a GLB scene graph. Geometries stay shared; we swap in corridor materials. */

export function cloneGltf(scene) {
  return scene.clone(true)
}

export function applyNamedMaterials(root, pickMaterial, { shadows = true, raycast } = {}) {
  root.traverse((obj) => {
    if (!obj.isMesh) return
    const mat = pickMaterial(obj.name)
    if (mat) obj.material = mat
    if (shadows) {
      obj.castShadow = true
      obj.receiveShadow = true
    }
    if (raycast === false) obj.raycast = () => {}
  })
}

export function doorMaterialFor(name, materials) {
  if (
    /Knob|Plate|Rose|Neck|Lock|Strike|Escutcheon|Bolt|Collar|Keyhole|HingeKnuckle|HingeLeaf/i.test(
      name
    )
  ) {
    return materials.brass
  }
  if (/Panel/i.test(name)) return materials.doorPanel
  if (/Jamb|Header|Casing|Stop|Plinth|Mold/i.test(name)) return materials.wainscot
  return materials.door
}

export function pendantMaterialFor(name, materials) {
  if (/Inner/i.test(name)) return materials.pendantInner
  if (/Cord$/i.test(name) || name === 'Cord') return materials.pendantCord
  if (/Canopy$/i.test(name) || name === 'Canopy') return materials.pendantCanopy
  if (/Rim/i.test(name)) return materials.pendantRim
  if (/Collar|Nipple|Ferrule/i.test(name)) return materials.brass
  return materials.pendantOuter
}
