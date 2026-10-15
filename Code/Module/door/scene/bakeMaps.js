/** Shared UV2 / lightMap helpers for Bake0 shell + Bake1 furniture. */

export function lightChannel(geometry) {
  if (geometry.getAttribute('uv2')) return 2
  if (geometry.getAttribute('uv1')) return 1
  return 0
}

/** Point lightMap/aoMap at the mesh UV channel that holds the bake atlas. */
export function assignLightMaps(root, materials) {
  const list = Array.isArray(materials) ? materials : [materials]
  let channel = 0
  root.traverse((obj) => {
    if (obj.isMesh && obj.geometry) channel = lightChannel(obj.geometry) || channel
  })
  for (const mat of list) {
    if (!mat) continue
    if (mat.lightMap) mat.lightMap.channel = channel
    if (mat.aoMap) mat.aoMap.channel = channel
  }
}
