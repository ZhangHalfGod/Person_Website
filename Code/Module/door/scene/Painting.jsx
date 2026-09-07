import React from 'react'
import { HALF_W, PAINTING } from './roomLayout.js'

function CornerRosette({ position, materials }) {
  return (
    <mesh position={position} material={materials.gold}>
      <sphereGeometry args={[0.035, 10, 10]} />
    </mesh>
  )
}

export default function Painting({ materials }) {
  const { z, y, w, h } = PAINTING
  const x = HALF_W - 0.055

  return (
    <group position={[x, y, z]} rotation={[0, -Math.PI / 2, 0]} userData={{ id: 'painting' }}>
      <mesh material={materials.goldDark} castShadow>
        <boxGeometry args={[w + 0.16, h + 0.16, 0.05]} />
      </mesh>
      <mesh position={[0, 0, 0.018]} material={materials.gold}>
        <boxGeometry args={[w + 0.1, h + 0.1, 0.03]} />
      </mesh>
      <mesh position={[0, 0, 0.032]} material={materials.frameWood}>
        <boxGeometry args={[w + 0.04, h + 0.04, 0.02]} />
      </mesh>
      <mesh position={[0, 0, 0.042]} material={materials.gold}>
        <boxGeometry args={[w + 0.02, h + 0.02, 0.012]} />
      </mesh>
      <mesh position={[0, 0, 0.05]} material={materials.canvasWhite}>
        <boxGeometry args={[w, h, 0.01]} />
      </mesh>
      <CornerRosette position={[-(w / 2 + 0.04), h / 2 + 0.04, 0.04]} materials={materials} />
      <CornerRosette position={[w / 2 + 0.04, h / 2 + 0.04, 0.04]} materials={materials} />
      <CornerRosette position={[-(w / 2 + 0.04), -(h / 2 + 0.04), 0.04]} materials={materials} />
      <CornerRosette position={[w / 2 + 0.04, -(h / 2 + 0.04), 0.04]} materials={materials} />

      <mesh position={[0, h / 2 + 0.14, 0.08]} material={materials.brass}>
        <boxGeometry args={[w * 0.55, 0.025, 0.04]} />
      </mesh>
      <mesh position={[0, h / 2 + 0.1, 0.11]} material={materials.brass}>
        <boxGeometry args={[w * 0.42, 0.02, 0.06]} />
      </mesh>
    </group>
  )
}
