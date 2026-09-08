import React from 'react'
import { getDoorZ } from './cameraStops.js'
import {
  START_Z,
  INNER_WIDTH,
  HEIGHT,
  WALL_THICKNESS,
  WAINSCOT_HEIGHT,
  DOOR_W,
  getCorridorEndZ,
  getCorridorLength,
  getCorridorCenterZ
} from './corridorLayout.js'

const LAST_DOOR_Z = getDoorZ(3)
const CASING = 0.11
const OPEN_HALF = DOOR_W / 2 + CASING + 0.04
const PANEL_INSET = 0.055
const PANEL_Y0 = 0.14
const PANEL_Y1 = 1.46
const BACKER_X = INNER_WIDTH / 2 + 0.17

function wainscotBays(endZ) {
  const doorZs = [0, 1, 2, 3].map(getDoorZ)
  const bays = [[START_Z + 0.35, doorZs[0] - OPEN_HALF]]
  for (let i = 0; i < doorZs.length - 1; i += 1) {
    bays.push([doorZs[i] + OPEN_HALF, doorZs[i + 1] - OPEN_HALF])
  }
  bays.push([doorZs[doorZs.length - 1] + OPEN_HALF, endZ - 0.4])
  return bays
}

function WainscotDressing({ materials }) {
  const endZ = getCorridorEndZ(LAST_DOOR_Z)
  const length = getCorridorLength(endZ)
  const centerZ = getCorridorCenterZ(endZ)
  const half = INNER_WIDTH / 2
  const panelH = PANEL_Y1 - PANEL_Y0
  const panelY = (PANEL_Y0 + PANEL_Y1) / 2
  const bays = wainscotBays(endZ)

  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh
            position={[side * (half - 0.01), WAINSCOT_HEIGHT - 0.02, centerZ]}
            material={materials.wainscot}
            receiveShadow
            raycast={() => {}}
          >
            <boxGeometry args={[0.05, 0.07, length]} />
          </mesh>
          <mesh
            position={[side * (half - 0.01), 0.05, centerZ]}
            material={materials.wainscot}
            receiveShadow
            raycast={() => {}}
          >
            <boxGeometry args={[0.04, 0.1, length]} />
          </mesh>
          {bays.map(([z0, z1], bi) => {
            const span = z1 - z0
            if (span < 0.8) return null
            const n = span > 3.5 ? 2 : 1
            const gap = 0.08
            const pw = (span - gap * (n + 1)) / n
            const panels = []
            for (let k = 0; k < n; k += 1) {
              const cz = z0 + gap + pw / 2 + k * (pw + gap)
              panels.push(
                <mesh
                  key={`p-${side}-${bi}-${k}`}
                  position={[side * (half + PANEL_INSET), panelY, cz]}
                  material={materials.wainscot}
                  receiveShadow
                  castShadow
                  raycast={() => {}}
                >
                  <boxGeometry args={[0.028, panelH, pw]} />
                </mesh>
              )
            }
            return panels
          })}
          {bays.flatMap(([z0, z1], bi) => {
            const span = z1 - z0
            if (span < 0.8) return []
            const n = span > 3.5 ? 2 : 1
            const gap = 0.08
            const pw = (span - gap * (n + 1)) / n
            const stiles = []
            for (let k = 0; k < n - 1; k += 1) {
              const left = z0 + gap + pw + k * (pw + gap)
              const cz = left + gap / 2
              stiles.push(
                <mesh
                  key={`s-${side}-${bi}-${k}`}
                  position={[side * half, panelY, cz]}
                  material={materials.wainscot}
                  raycast={() => {}}
                >
                  <boxGeometry args={[0.045, panelH + 0.04, Math.max(0.05, gap * 0.9)]} />
                </mesh>
              )
            }
            return stiles
          })}
        </group>
      ))}
    </group>
  )
}

export default function Corridor({ materials }) {
  const endZ = getCorridorEndZ(LAST_DOOR_Z)
  const length = getCorridorLength(endZ)
  const centerZ = getCorridorCenterZ(endZ)
  const half = INNER_WIDTH / 2
  const upperH = HEIGHT - WAINSCOT_HEIGHT
  const upperY = WAINSCOT_HEIGHT + upperH / 2
  const wallX = half + WALL_THICKNESS / 2

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

      <mesh
        position={[0, HEIGHT, centerZ]}
        rotation={[Math.PI / 2, 0, 0]}
        material={materials.ceiling}
        receiveShadow
      >
        <planeGeometry args={[INNER_WIDTH + WALL_THICKNESS * 2, length]} />
      </mesh>

      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh
            position={[side * BACKER_X, WAINSCOT_HEIGHT / 2, centerZ]}
            receiveShadow
            material={materials.wainscot}
            raycast={() => {}}
          >
            <boxGeometry args={[WALL_THICKNESS, WAINSCOT_HEIGHT, length]} />
          </mesh>
          <mesh
            position={[side * wallX, upperY, centerZ]}
            material={materials.upperWall}
            receiveShadow
            raycast={() => {}}
          >
            <boxGeometry args={[WALL_THICKNESS, upperH, length]} />
          </mesh>
        </group>
      ))}

      <WainscotDressing materials={materials} />

      <mesh position={[0, HEIGHT / 2, endZ]} material={materials.endCap}>
        <boxGeometry args={[INNER_WIDTH + WALL_THICKNESS * 2, HEIGHT, 0.2]} />
      </mesh>
      <mesh position={[0, HEIGHT / 2, START_Z]} material={materials.endCap}>
        <boxGeometry args={[INNER_WIDTH + WALL_THICKNESS * 2, HEIGHT, 0.2]} />
      </mesh>
    </group>
  )
}
