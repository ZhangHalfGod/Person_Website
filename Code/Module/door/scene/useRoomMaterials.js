import { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'

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
    brassNormal: '/textures/Main/brass_normal.jpg'
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
      wainscot: new THREE.MeshStandardMaterial({
        map: maps.wallMap,
        roughnessMap: maps.wallRough,
        normalMap: maps.wallNormal,
        roughness: 0.62,
        metalness: 0.02,
        color: '#d9cbb8'
      }),
      upperWall: new THREE.MeshStandardMaterial({
        color: '#12110f',
        roughness: 0.96,
        metalness: 0
      }),
      ceiling: new THREE.MeshStandardMaterial({
        color: '#0b0a09',
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
      brass: new THREE.MeshStandardMaterial({
        map: maps.brassMap,
        roughnessMap: maps.brassRough,
        normalMap: maps.brassNormal,
        color: '#e8d0a0',
        roughness: 0.32,
        metalness: 0.9,
        envMapIntensity: 1
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
      goldDark: new THREE.MeshStandardMaterial({
        map: maps.brassMap,
        roughnessMap: maps.brassRough,
        normalMap: maps.brassNormal,
        color: '#8a6a32',
        roughness: 0.4,
        metalness: 0.78
      }),
      canvasWhite: new THREE.MeshStandardMaterial({
        color: '#f4f1ea',
        roughness: 0.88,
        metalness: 0
      }),
      boardWhite: new THREE.MeshStandardMaterial({
        color: '#eeeae2',
        roughness: 0.9,
        metalness: 0
      }),
      frameWood: new THREE.MeshStandardMaterial({
        color: '#1c140e',
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
      })
    }
  }, [maps])
}
