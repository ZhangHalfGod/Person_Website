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

export function useCorridorMaterials() {
  const maps = useTexture({
    woodMap: '/textures/Main/wainscot_albedo.jpg',
    woodRough: '/textures/Main/wainscot_roughness.jpg',
    woodNormal: '/textures/Main/wainscot_normal.jpg',
    brassMap: '/textures/Main/brass_albedo.jpg',
    brassRough: '/textures/Main/brass_roughness.jpg',
    brassNormal: '/textures/Main/brass_normal.jpg'
  })

  useLayoutEffect(() => {
    prep(maps.woodMap, { srgb: true, repeat: [14, 1.15] })
    prep(maps.woodRough, { repeat: [14, 1.15] })
    prep(maps.woodNormal, { repeat: [14, 1.15] })
    prep(maps.brassMap, { srgb: true, repeat: [2, 2] })
    prep(maps.brassRough, { repeat: [2, 2] })
    prep(maps.brassNormal, { repeat: [2, 2] })
  }, [maps])

  return useMemo(() => {
    const floorMap = cloneRepeat(maps.woodMap, [2.2, 14], true)
    const floorRough = cloneRepeat(maps.woodRough, [2.2, 14], false)
    const floorNormal = cloneRepeat(maps.woodNormal, [2.2, 14], false)

    const doorMap = cloneRepeat(maps.woodMap, [1.15, 2.15], true)
    const doorRough = cloneRepeat(maps.woodRough, [1.15, 2.15], false)
    const doorNormal = cloneRepeat(maps.woodNormal, [1.15, 2.15], false)

    return {
      floor: new THREE.MeshStandardMaterial({
        map: floorMap,
        roughnessMap: floorRough,
        normalMap: floorNormal,
        roughness: 0.28,
        metalness: 0.1,
        envMapIntensity: 0.7,
        color: '#cfc3b4'
      }),
      wainscot: new THREE.MeshStandardMaterial({
        map: maps.woodMap,
        roughnessMap: maps.woodRough,
        normalMap: maps.woodNormal,
        roughness: 0.48,
        metalness: 0.06,
        envMapIntensity: 0.45,
        color: '#d9cbb8'
      }),
      upperWall: new THREE.MeshStandardMaterial({
        color: '#4e463e',
        roughness: 0.94,
        metalness: 0,
        envMapIntensity: 0
      }),
      ceiling: new THREE.MeshStandardMaterial({
        color: '#6a6258',
        roughness: 0.97,
        metalness: 0,
        envMapIntensity: 0
      }),
      door: new THREE.MeshStandardMaterial({
        map: doorMap,
        roughnessMap: doorRough,
        normalMap: doorNormal,
        roughness: 0.46,
        metalness: 0.06,
        envMapIntensity: 0.48,
        color: '#d4c6b4'
      }),
      doorPanel: new THREE.MeshStandardMaterial({
        map: doorMap,
        roughnessMap: doorRough,
        normalMap: doorNormal,
        roughness: 0.58,
        metalness: 0.05,
        envMapIntensity: 0.38,
        color: '#c6b49e'
      }),
      brass: new THREE.MeshStandardMaterial({
        map: maps.brassMap,
        roughnessMap: maps.brassRough,
        normalMap: maps.brassNormal,
        color: '#e8d0a0',
        roughness: 0.28,
        metalness: 0.9,
        envMapIntensity: 1.1
      }),
      pendantOuter: new THREE.MeshStandardMaterial({
        color: '#1c1814',
        roughness: 0.88,
        metalness: 0.08,
        envMapIntensity: 0.22
      }),
      pendantInner: new THREE.MeshStandardMaterial({
        color: '#c9a06a',
        roughness: 0.35,
        metalness: 0.12,
        emissive: '#ff9a4a',
        emissiveIntensity: 0.28,
        envMapIntensity: 0.4
      }),
      pendantCord: new THREE.MeshStandardMaterial({
        color: '#9a8c7c',
        roughness: 0.52,
        metalness: 0.18,
        envMapIntensity: 0.4
      }),
      pendantCanopy: new THREE.MeshStandardMaterial({
        color: '#5a4c3e',
        roughness: 0.45,
        metalness: 0.42,
        envMapIntensity: 0.5
      }),
      pendantRim: new THREE.MeshStandardMaterial({
        color: '#2a241c',
        roughness: 0.32,
        metalness: 0.55,
        envMapIntensity: 0.7
      }),
      endCap: new THREE.MeshStandardMaterial({
        color: '#1a1614',
        roughness: 0.92,
        envMapIntensity: 0.08
      })
    }
  }, [maps])
}
