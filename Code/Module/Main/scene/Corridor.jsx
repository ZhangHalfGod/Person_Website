import React from 'react'
import { getDoorZ } from './cameraStops.js'
import {
  START_Z,
  INNER_WIDTH,
  HEIGHT,
  WALL_THICKNESS,
  WAINSCOT_HEIGHT,
  getCorridorEndZ,
  getCorridorLength,
  getCorridorCenterZ
} from './corridorLayout.js'

const LAST_DOOR_Z = getDoorZ(3)

export default function Corridor({ materials }) {
  const endZ = getCorridorEndZ(LAST_DOOR_Z)
  const length = getCorridorLength(endZ)
  const centerZ = getCorridorCenterZ(endZ)
  const half = INNER_WIDTH / 2
  const wallX = half + WALL_THICKNESS / 2
  const upperH = HEIGHT - WAINSCOT_HEIGHT
  const upperY = WAINSCOT_HEIGHT + upperH / 2

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, centerZ]}
        receiveShadow
        material={materials.floor}
      >
        <planeGeometry args={[INNER_WIDTH, length]} />
      </mesh>

      <mesh position={[0, HEIGHT, centerZ]} rotation={[Math.PI / 2, 0, 0]} material={materials.ceiling}>
        <planeGeometry args={[INNER_WIDTH + WALL_THICKNESS * 2, length]} />
      </mesh>

      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh
            position={[side * wallX, WAINSCOT_HEIGHT / 2, centerZ]}
            receiveShadow
            material={materials.wainscot}
          >
            <boxGeometry args={[WALL_THICKNESS, WAINSCOT_HEIGHT, length]} />
          </mesh>
          <mesh position={[side * wallX, upperY, centerZ]} material={materials.upperWall}>
            <boxGeometry args={[WALL_THICKNESS, upperH, length]} />
          </mesh>
        </group>
      ))}

      <mesh position={[0, HEIGHT / 2, endZ]} material={materials.endCap}>
        <boxGeometry args={[INNER_WIDTH + WALL_THICKNESS * 2, HEIGHT, 0.2]} />
      </mesh>
      <mesh position={[0, HEIGHT / 2, START_Z]} material={materials.endCap}>
        <boxGeometry args={[INNER_WIDTH + WALL_THICKNESS * 2, HEIGHT, 0.2]} />
      </mesh>
    </group>
  )
}
