import { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'

function prepLight(tex) {
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.flipY = false
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  tex.needsUpdate = true
  return tex
}

function prep(tex, { srgb = false, repeat = [1, 1] } = {}) {
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 8
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  tex.repeat.set(repeat[0], repeat[1])
  tex.needsUpdate = true
  return tex
}

function cloneRepeat(tex, repeat, srgb) {
  const copy = tex.clone()
  copy.wrapS = THREE.RepeatWrapping
  copy.wrapT = THREE.RepeatWrapping
  copy.anisotropy = 8
  copy.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  copy.repeat.set(repeat[0], repeat[1])
  copy.needsUpdate = true
  return copy
}

export function useRoomMaterials() {
  const maps = useTexture({
    floorMap: '/textures/door/room_floor_albedo.jpg',
    floorRough: '/textures/door/room_floor_roughness.jpg',
    floorNormal: '/textures/door/room_floor_normal.jpg',
    wallMap: '/textures/door/room_wall_albedo.jpg',
    wallRough: '/textures/door/room_wall_roughness.jpg',
    wallNormal: '/textures/door/room_wall_normal.jpg',
    brassMap: '/textures/Main/brass_albedo.jpg',
    brassRough: '/textures/Main/brass_roughness.jpg',
    brassNormal: '/textures/Main/brass_normal.jpg',
    floorLight: '/textures/door/room_floor_lightmap.jpg?v=oc01',
    floorAo: '/textures/door/room_floor_ao.jpg?v=oc01',
    wallLight: '/textures/door/room_wall_lightmap.jpg',
    wallAo: '/textures/door/room_wall_ao.jpg',
    tableLight: '/textures/door/table_lightmap.jpg',
    tableAo: '/textures/door/table_ao.jpg',
    stoolLight: '/textures/door/stool_lightmap.jpg',
    stoolAo: '/textures/door/stool_ao.jpg',
    bookcaseLight: '/textures/door/bookcase_lightmap.jpg',
    bookcaseAo: '/textures/door/bookcase_ao.jpg',
    frameLight: '/textures/door/picture_frame_lightmap.jpg',
    frameAo: '/textures/door/picture_frame_ao.jpg',
    picLampLight: '/textures/door/picture_lamp_lightmap.jpg',
    picLampAo: '/textures/door/picture_lamp_ao.jpg',
    tableLampLight: '/textures/door/table_lamp_lightmap.jpg',
    tableLampAo: '/textures/door/table_lamp_ao.jpg',
    cofferLight: '/textures/door/ceiling_coffers_lightmap.jpg',
    cofferAo: '/textures/door/ceiling_coffers_ao.jpg'
  })

  useLayoutEffect(() => {
    prep(maps.floorMap, { srgb: true, repeat: [3.2, 4.4] })
    prep(maps.floorRough, { repeat: [3.2, 4.4] })
    prep(maps.floorNormal, { repeat: [3.2, 4.4] })
    prep(maps.wallMap, { srgb: true, repeat: [2.4, 1.6] })
    prep(maps.wallRough, { repeat: [2.4, 1.6] })
    prep(maps.wallNormal, { repeat: [2.4, 1.6] })
    prep(maps.brassMap, { srgb: true, repeat: [2, 2] })
    prep(maps.brassRough, { repeat: [2, 2] })
    prep(maps.brassNormal, { repeat: [2, 2] })
    ;[
      maps.floorLight,
      maps.floorAo,
      maps.wallLight,
      maps.wallAo,
      maps.tableLight,
      maps.tableAo,
      maps.stoolLight,
      maps.stoolAo,
      maps.bookcaseLight,
      maps.bookcaseAo,
      maps.frameLight,
      maps.frameAo,
      maps.picLampLight,
      maps.picLampAo,
      maps.tableLampLight,
      maps.tableLampAo,
      maps.cofferLight,
      maps.cofferAo
    ].forEach(prepLight)
  }, [maps])

  return useMemo(() => {
    const doorMap = cloneRepeat(maps.wallMap, [1.2, 2.2], true)
    const doorRough = cloneRepeat(maps.wallRough, [1.2, 2.2], false)
    const doorNormal = cloneRepeat(maps.wallNormal, [1.2, 2.2], false)
    const furnitureMap = cloneRepeat(maps.wallMap, [1.6, 1.1], true)
    const furnitureRough = cloneRepeat(maps.wallRough, [1.6, 1.1], false)
    const furnitureNormal = cloneRepeat(maps.wallNormal, [1.6, 1.1], false)

    return {
      floor: new THREE.MeshStandardMaterial({
        map: maps.floorMap,
        roughnessMap: maps.floorRough,
        normalMap: maps.floorNormal,
        roughness: 0.34,
        metalness: 0.06,
        color: '#cfc3b4'
      }),
      floorLit: new THREE.MeshStandardMaterial({
        map: maps.floorMap,
        roughnessMap: maps.floorRough,
        normalMap: maps.floorNormal,
        lightMap: maps.floorLight,
        aoMap: maps.floorAo,
        lightMapIntensity: 1.18,
        aoMapIntensity: 0.88,
        // OC-03: slight satin plank sheen (no IBL fill)
        roughness: 0.18,
        metalness: 0.08,
        envMapIntensity: 0.28,
        color: '#a0907c'
      }),
      wainscot: new THREE.MeshStandardMaterial({
        map: maps.wallMap,
        roughnessMap: maps.wallRough,
        normalMap: maps.wallNormal,
        roughness: 0.62,
        metalness: 0.02,
        color: '#d9cbb8'
      }),
      wainscotLit: new THREE.MeshStandardMaterial({
        map: maps.wallMap,
        roughnessMap: maps.wallRough,
        normalMap: maps.wallNormal,
        lightMap: maps.wallLight,
        aoMap: maps.wallAo,
        lightMapIntensity: 0.52,
        aoMapIntensity: 0.82,
        roughness: 0.68,
        metalness: 0.02,
        color: '#9a8a74'
      }),
      upperWall: new THREE.MeshStandardMaterial({
        color: '#0a0908',
        roughness: 0.98,
        metalness: 0
      }),
      upperLit: new THREE.MeshStandardMaterial({
        color: '#0e0d0b',
        lightMap: maps.wallLight,
        aoMap: maps.wallAo,
        lightMapIntensity: 0.26,
        aoMapIntensity: 0.9,
        roughness: 0.96,
        metalness: 0
      }),
      ceiling: new THREE.MeshStandardMaterial({
        color: '#070605',
        roughness: 1,
        metalness: 0
      }),
      beam: new THREE.MeshStandardMaterial({
        map: maps.wallMap,
        roughnessMap: maps.wallRough,
        normalMap: maps.wallNormal,
        roughness: 0.7,
        metalness: 0.02,
        color: '#b9a48c'
      }),
      door: new THREE.MeshStandardMaterial({
        map: doorMap,
        roughnessMap: doorRough,
        normalMap: doorNormal,
        roughness: 0.55,
        metalness: 0.04,
        color: '#cbb7a2'
      }),
      doorPanel: new THREE.MeshStandardMaterial({
        color: '#2a1a10',
        roughness: 0.7,
        metalness: 0.03
      }),
      furniture: new THREE.MeshStandardMaterial({
        map: furnitureMap,
        roughnessMap: furnitureRough,
        normalMap: furnitureNormal,
        roughness: 0.52,
        metalness: 0.03,
        color: '#c4ae96'
      }),
      furnitureDark: new THREE.MeshStandardMaterial({
        color: '#2c1c12',
        roughness: 0.68,
        metalness: 0.02
      }),
      /**
       * OC-03 satin tabletop — MeshPhysical clearcoat (weak).
       * No room IBL; sheen mostly from live lamps + clearcoat.
       */
      tableLit: new THREE.MeshPhysicalMaterial({
        map: furnitureMap,
        roughnessMap: furnitureRough,
        normalMap: furnitureNormal,
        lightMap: maps.tableLight,
        aoMap: maps.tableAo,
        lightMapIntensity: 0.78,
        aoMapIntensity: 0.85,
        roughness: 0.3,
        metalness: 0.05,
        clearcoat: 0.2,
        clearcoatRoughness: 0.38,
        envMapIntensity: 0.35,
        color: '#9a846e'
      }),
      stoolLit: new THREE.MeshPhysicalMaterial({
        map: furnitureMap,
        roughnessMap: furnitureRough,
        normalMap: furnitureNormal,
        lightMap: maps.stoolLight,
        aoMap: maps.stoolAo,
        lightMapIntensity: 0.72,
        aoMapIntensity: 0.82,
        roughness: 0.36,
        metalness: 0.03,
        clearcoat: 0.12,
        clearcoatRoughness: 0.45,
        envMapIntensity: 0.28,
        color: '#95806a'
      }),
      stoolDarkLit: new THREE.MeshStandardMaterial({
        color: '#1e140e',
        lightMap: maps.stoolLight,
        aoMap: maps.stoolAo,
        lightMapIntensity: 0.55,
        aoMapIntensity: 0.88,
        roughness: 0.7,
        metalness: 0.02
      }),
      /** OC-03: shelves slightly more open; books darker/varied for spine depth. */
      bookcaseLit: new THREE.MeshStandardMaterial({
        map: furnitureMap,
        roughnessMap: furnitureRough,
        normalMap: furnitureNormal,
        lightMap: maps.bookcaseLight,
        aoMap: maps.bookcaseAo,
        lightMapIntensity: 0.72,
        aoMapIntensity: 0.95,
        roughness: 0.58,
        metalness: 0.03,
        color: '#8a7460'
      }),
      bookcaseDarkLit: new THREE.MeshStandardMaterial({
        color: '#1a100c',
        lightMap: maps.bookcaseLight,
        aoMap: maps.bookcaseAo,
        lightMapIntensity: 0.38,
        aoMapIntensity: 1.05,
        roughness: 0.78,
        metalness: 0.02
      }),
      bookcaseBookMid: new THREE.MeshStandardMaterial({
        color: '#2a1810',
        lightMap: maps.bookcaseLight,
        aoMap: maps.bookcaseAo,
        lightMapIntensity: 0.42,
        aoMapIntensity: 1.0,
        roughness: 0.74,
        metalness: 0.02
      }),
      bookcaseBookDeep: new THREE.MeshStandardMaterial({
        color: '#0e0a08',
        lightMap: maps.bookcaseLight,
        aoMap: maps.bookcaseAo,
        lightMapIntensity: 0.32,
        aoMapIntensity: 1.1,
        roughness: 0.82,
        metalness: 0.02
      }),
      brass: new THREE.MeshStandardMaterial({
        map: maps.brassMap,
        roughnessMap: maps.brassRough,
        normalMap: maps.brassNormal,
        color: '#e8d0a0',
        roughness: 0.32,
        metalness: 0.9,
        envMapIntensity: 1
      }),
      brassFrameLit: new THREE.MeshStandardMaterial({
        map: maps.brassMap,
        roughnessMap: maps.brassRough,
        normalMap: maps.brassNormal,
        lightMap: maps.frameLight,
        aoMap: maps.frameAo,
        lightMapIntensity: 0.62,
        aoMapIntensity: 0.7,
        color: '#e0c894',
        roughness: 0.28,
        metalness: 0.9,
        envMapIntensity: 0.55
      }),
      brassPicLampLit: new THREE.MeshStandardMaterial({
        map: maps.brassMap,
        roughnessMap: maps.brassRough,
        normalMap: maps.brassNormal,
        lightMap: maps.picLampLight,
        aoMap: maps.picLampAo,
        lightMapIntensity: 0.55,
        aoMapIntensity: 0.65,
        color: '#e8d0a0',
        roughness: 0.28,
        metalness: 0.9,
        envMapIntensity: 0.5
      }),
      brassTableLampLit: new THREE.MeshStandardMaterial({
        map: maps.brassMap,
        roughnessMap: maps.brassRough,
        normalMap: maps.brassNormal,
        lightMap: maps.tableLampLight,
        aoMap: maps.tableLampAo,
        lightMapIntensity: 0.5,
        aoMapIntensity: 0.62,
        color: '#e8d0a0',
        roughness: 0.3,
        metalness: 0.9,
        envMapIntensity: 0.45
      }),
      gold: new THREE.MeshStandardMaterial({
        map: maps.brassMap,
        roughnessMap: maps.brassRough,
        normalMap: maps.brassNormal,
        color: '#d4af6a',
        roughness: 0.28,
        metalness: 0.85,
        envMapIntensity: 1.05
      }),
      goldLit: new THREE.MeshStandardMaterial({
        map: maps.brassMap,
        roughnessMap: maps.brassRough,
        normalMap: maps.brassNormal,
        lightMap: maps.frameLight,
        aoMap: maps.frameAo,
        lightMapIntensity: 0.65,
        aoMapIntensity: 0.68,
        color: '#d4af6a',
        roughness: 0.26,
        metalness: 0.88,
        envMapIntensity: 0.6
      }),
      goldDark: new THREE.MeshStandardMaterial({
        map: maps.brassMap,
        roughnessMap: maps.brassRough,
        normalMap: maps.brassNormal,
        color: '#8a6a32',
        roughness: 0.4,
        metalness: 0.78
      }),
      goldDarkLit: new THREE.MeshStandardMaterial({
        map: maps.brassMap,
        roughnessMap: maps.brassRough,
        normalMap: maps.brassNormal,
        lightMap: maps.frameLight,
        aoMap: maps.frameAo,
        lightMapIntensity: 0.55,
        aoMapIntensity: 0.72,
        color: '#8a6a32',
        roughness: 0.38,
        metalness: 0.8,
        envMapIntensity: 0.45
      }),
      /** Soft wash read: slight warm emissive so panels stay bright under low fill. */
      canvasWhite: new THREE.MeshStandardMaterial({
        color: '#f6f2e8',
        emissive: '#ffe8c0',
        emissiveIntensity: 0.22,
        roughness: 0.86,
        metalness: 0
      }),
      boardWhite: new THREE.MeshStandardMaterial({
        color: '#f2eee4',
        emissive: '#ffe4b8',
        emissiveIntensity: 0.2,
        roughness: 0.88,
        metalness: 0
      }),
      frameWood: new THREE.MeshStandardMaterial({
        color: '#1c140e',
        roughness: 0.72,
        metalness: 0.04
      }),
      frameWoodLit: new THREE.MeshStandardMaterial({
        color: '#14100c',
        lightMap: maps.frameLight,
        aoMap: maps.frameAo,
        lightMapIntensity: 0.5,
        aoMapIntensity: 0.78,
        roughness: 0.72,
        metalness: 0.04
      }),
      voidMat: new THREE.MeshStandardMaterial({
        color: '#050506',
        roughness: 1,
        metalness: 0
      }),
      lampShadeOuter: new THREE.MeshStandardMaterial({
        color: '#6a4a32',
        roughness: 0.42,
        metalness: 0.28
      }),
      lampShadeOuterLit: new THREE.MeshStandardMaterial({
        color: '#6a4a32',
        lightMap: maps.tableLampLight,
        aoMap: maps.tableLampAo,
        lightMapIntensity: 0.48,
        aoMapIntensity: 0.6,
        roughness: 0.42,
        metalness: 0.28
      }),
      lampShadeInner: new THREE.MeshStandardMaterial({
        color: '#f0c48a',
        emissive: '#ffb366',
        emissiveIntensity: 0.55,
        roughness: 0.55,
        metalness: 0.05,
        side: THREE.DoubleSide
      }),
      lampCord: new THREE.MeshStandardMaterial({
        color: '#1a1410',
        roughness: 0.78,
        metalness: 0.05
      }),
      lampBulb: new THREE.MeshStandardMaterial({
        color: '#fff3d6',
        emissive: '#ffcc88',
        emissiveIntensity: 1.4,
        roughness: 0.35,
        metalness: 0
      }),
      beamLit: new THREE.MeshStandardMaterial({
        map: maps.wallMap,
        roughnessMap: maps.wallRough,
        normalMap: maps.wallNormal,
        lightMap: maps.cofferLight,
        aoMap: maps.cofferAo,
        lightMapIntensity: 0.42,
        aoMapIntensity: 0.88,
        roughness: 0.72,
        metalness: 0.02,
        color: '#8a7864'
      }),
      ceilingLit: new THREE.MeshStandardMaterial({
        color: '#0a0908',
        lightMap: maps.cofferLight,
        aoMap: maps.cofferAo,
        lightMapIntensity: 0.28,
        aoMapIntensity: 0.92,
        roughness: 1,
        metalness: 0
      })
    }
  }, [maps])
}
