import { useMemo } from 'react'
import * as THREE from 'three'

function makeWoodMap({ base, dark, grain = 70 }) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 512, 512)
  for (let i = 0; i < grain; i += 1) {
    const x = Math.random() * 512
    ctx.strokeStyle = dark
    ctx.globalAlpha = 0.06 + Math.random() * 0.14
    ctx.lineWidth = 1 + Math.random() * 2.4
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.bezierCurveTo(x + 8, 180, x - 10, 340, x + (Math.random() * 12 - 6), 512)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 8
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export function useRoomMaterials() {
  return useMemo(() => {
    const floorMap = makeWoodMap({ base: '#2a1a10', dark: '#120a06', grain: 95 })
    floorMap.repeat.set(3.2, 4.4)

    const wallMap = makeWoodMap({ base: '#3a2416', dark: '#1a0e08', grain: 60 })
    wallMap.repeat.set(2.4, 1.6)

    const doorMap = makeWoodMap({ base: '#3d2618', dark: '#1a100a', grain: 50 })
    doorMap.repeat.set(1.2, 2.2)

    const furnitureMap = makeWoodMap({ base: '#4a2e18', dark: '#1c1008', grain: 45 })
    furnitureMap.repeat.set(1.6, 1.1)

    return {
      floor: new THREE.MeshStandardMaterial({
        map: floorMap,
        roughness: 0.34,
        metalness: 0.06,
        color: '#cfc3b4'
      }),
      wainscot: new THREE.MeshStandardMaterial({
        map: wallMap,
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
        map: wallMap,
        roughness: 0.7,
        metalness: 0.02,
        color: '#b9a48c'
      }),
      door: new THREE.MeshStandardMaterial({
        map: doorMap,
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
        color: '#c4a056',
        roughness: 0.32,
        metalness: 0.74
      }),
      gold: new THREE.MeshStandardMaterial({
        color: '#d4af6a',
        roughness: 0.28,
        metalness: 0.82
      }),
      goldDark: new THREE.MeshStandardMaterial({
        color: '#8a6a32',
        roughness: 0.4,
        metalness: 0.7
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
      })
    }
  }, [])
}
