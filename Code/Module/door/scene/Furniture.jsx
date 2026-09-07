import React from 'react'
import { TABLE } from './roomLayout.js'

function Stool({ position, materials }) {
  return (
    <group position={position} userData={{ id: 'stool' }}>
      <mesh position={[0, 0.47, 0]} castShadow receiveShadow material={materials.furniture}>
        <boxGeometry args={[0.36, 0.05, 0.36]} />
      </mesh>
      {[
        [-0.13, 0.22, -0.13],
        [0.13, 0.22, -0.13],
        [-0.13, 0.22, 0.13],
        [0.13, 0.22, 0.13]
      ].map((pos, i) => (
        <mesh key={i} position={pos} castShadow material={materials.furnitureDark}>
          <boxGeometry args={[0.045, 0.44, 0.045]} />
        </mesh>
      ))}
    </group>
  )
}

export default function Furniture({ materials }) {
  const { x, z, w, d, h } = TABLE
  const topY = h
  const legH = h - 0.06
  const inset = 0.08

  return (
    <group>
      <group position={[x, 0, z]} userData={{ id: 'table' }}>
        <mesh position={[0, topY, 0]} castShadow receiveShadow material={materials.furniture}>
          <boxGeometry args={[w, 0.08, d]} />
        </mesh>
        <mesh position={[0, topY - 0.11, 0]} material={materials.furnitureDark}>
          <boxGeometry args={[w - 0.12, 0.06, d - 0.12]} />
        </mesh>
        {[
          [-(w / 2 - inset), legH / 2, -(d / 2 - inset)],
          [w / 2 - inset, legH / 2, -(d / 2 - inset)],
          [-(w / 2 - inset), legH / 2, d / 2 - inset],
          [w / 2 - inset, legH / 2, d / 2 - inset]
        ].map((pos, i) => (
          <mesh key={i} position={pos} castShadow material={materials.furnitureDark}>
            <boxGeometry args={[0.08, legH, 0.08]} />
          </mesh>
        ))}
      </group>

      <Stool position={[x - 0.58, 0, z - 0.72]} materials={materials} />
      <Stool position={[x + 0.62, 0, z - 0.58]} materials={materials} />
      <Stool position={[x - 0.12, 0, z + 0.78]} materials={materials} />
    </group>
  )
}
