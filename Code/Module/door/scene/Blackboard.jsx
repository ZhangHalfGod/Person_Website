import React from 'react'
import { HALF_W, BOARD } from './roomLayout.js'

export default function Blackboard({ materials }) {
  const { z, y, w, h } = BOARD
  const x = -HALF_W + 0.055

  return (
    <group position={[x, y, z]} rotation={[0, Math.PI / 2, 0]} userData={{ id: 'blackboard' }}>
      <mesh material={materials.frameWood} castShadow>
        <boxGeometry args={[w + 0.12, h + 0.12, 0.05]} />
      </mesh>
      <mesh position={[0, 0, 0.02]} material={materials.wainscot}>
        <boxGeometry args={[w + 0.06, h + 0.06, 0.03]} />
      </mesh>
      <mesh position={[0, 0, 0.038]} material={materials.boardWhite}>
        <boxGeometry args={[w, h, 0.012]} />
      </mesh>
      <mesh position={[0, h / 2 + 0.12, 0.07]} material={materials.brass}>
        <boxGeometry args={[w * 0.4, 0.022, 0.04]} />
      </mesh>
    </group>
  )
}
