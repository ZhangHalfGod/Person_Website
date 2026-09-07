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

export function useCorridorMaterials() {
  return useMemo(() => {
    const floorMap = makeWoodMap({ base: '#2c1c12', dark: '#140c08', grain: 90 })
    floorMap.repeat.set(2.2, 14)

    const doorMap = makeWoodMap({ base: '#3d2618', dark: '#1a100a', grain: 50 })
    doorMap.repeat.set(1.2, 2.2)

    const wainscotMap = makeWoodMap({ base: '#4a301e', dark: '#24160e', grain: 55 })
    wainscotMap.repeat.set(1.4, 8)

    return {
      floor: new THREE.MeshStandardMaterial({
        map: floorMap,
        roughness: 0.38,
        metalness: 0.06,
        color: '#cfc3b4'
      }),
      wainscot: new THREE.MeshStandardMaterial({
        map: wainscotMap,
        roughness: 0.62,
        metalness: 0.02,
        color: '#d9cbb8'
      }),
      upperWall: new THREE.MeshStandardMaterial({
        color: '#0c0d11',
        roughness: 0.96,
        metalness: 0
      }),
      ceiling: new THREE.MeshStandardMaterial({
        color: '#07080b',
        roughness: 1,
        metalness: 0
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
      brass: new THREE.MeshStandardMaterial({
        color: '#c4a056',
        roughness: 0.35,
        metalness: 0.72
      }),
      endCap: new THREE.MeshStandardMaterial({
        color: '#050506',
        roughness: 1
      })
    }
  }, [])
}
