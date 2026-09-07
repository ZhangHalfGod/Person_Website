import React from 'react'
import {
  ROOM_W,
  ROOM_D,
  ROOM_H,
  WALL_T,
  WAINSCOT_H,
  HALF_W,
  HALF_D,
  DOOR_W,
  DOOR_H,
  DOOR_X
} from './roomLayout.js'

function WallPanel({ position, size, material, receiveShadow = true }) {
  return (
    <mesh position={position} receiveShadow={receiveShadow} material={material}>
      <boxGeometry args={size} />
    </mesh>
  )
}

function CofferedCeiling({ materials }) {
  const beams = []
  const xs = [-2.2, 0, 2.2]
  const zs = [-2.6, -0.8, 1.0, 2.8]
  xs.forEach((x) => {
    beams.push(
      <mesh key={`x-${x}`} position={[x, ROOM_H - 0.06, 0]} material={materials.beam} castShadow>
        <boxGeometry args={[0.1, 0.12, ROOM_D - 0.08]} />
      </mesh>
    )
  })
  zs.forEach((z) => {
    beams.push(
      <mesh key={`z-${z}`} position={[0, ROOM_H - 0.05, z]} material={materials.beam}>
        <boxGeometry args={[ROOM_W - 0.12, 0.1, 0.1]} />
      </mesh>
    )
  })
  return <group>{beams}</group>
}

function DoorWall({ materials }) {
  const gapLeft = DOOR_X - DOOR_W / 2
  const gapRight = DOOR_X + DOOR_W / 2
  const leftW = gapLeft - (-HALF_W)
  const rightW = HALF_W - gapRight
  const leftX = -HALF_W + leftW / 2
  const rightX = gapRight + rightW / 2
  const upperH = ROOM_H - DOOR_H
  const z = -HALF_D - WALL_T / 2
  const wainscotTop = Math.min(WAINSCOT_H, DOOR_H)

  return (
    <group>
      <WallPanel
        position={[leftX, wainscotTop / 2, z]}
        size={[leftW, wainscotTop, WALL_T]}
        material={materials.wainscot}
      />
      <WallPanel
        position={[leftX, WAINSCOT_H + (ROOM_H - WAINSCOT_H) / 2, z]}
        size={[leftW, ROOM_H - WAINSCOT_H, WALL_T]}
        material={materials.upperWall}
        receiveShadow={false}
      />
      <WallPanel
        position={[rightX, wainscotTop / 2, z]}
        size={[rightW, wainscotTop, WALL_T]}
        material={materials.wainscot}
      />
      <WallPanel
        position={[rightX, WAINSCOT_H + (ROOM_H - WAINSCOT_H) / 2, z]}
        size={[rightW, ROOM_H - WAINSCOT_H, WALL_T]}
        material={materials.upperWall}
        receiveShadow={false}
      />
      <WallPanel
        position={[DOOR_X, DOOR_H + upperH / 2, z]}
        size={[DOOR_W + 0.04, upperH, WALL_T]}
        material={materials.upperWall}
        receiveShadow={false}
      />
      <mesh position={[DOOR_X, DOOR_H / 2, -HALF_D - 0.08]} material={materials.voidMat}>
        <boxGeometry args={[DOOR_W, DOOR_H, 0.06]} />
      </mesh>
    </group>
  )
}

export default function RoomInterior({ materials }) {
  const wallX = HALF_W + WALL_T / 2
  const upperH = ROOM_H - WAINSCOT_H
  const upperY = WAINSCOT_H + upperH / 2

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        material={materials.floor}
      >
        <planeGeometry args={[ROOM_W, ROOM_D]} />
      </mesh>

      <mesh position={[0, ROOM_H, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.ceiling}>
        <planeGeometry args={[ROOM_W + WALL_T * 2, ROOM_D + WALL_T * 2]} />
      </mesh>
      <CofferedCeiling materials={materials} />

      {[-1, 1].map((side) => (
        <group key={side}>
          <WallPanel
            position={[side * wallX, WAINSCOT_H / 2, 0]}
            size={[WALL_T, WAINSCOT_H, ROOM_D]}
            material={materials.wainscot}
          />
          <WallPanel
            position={[side * wallX, upperY, 0]}
            size={[WALL_T, upperH, ROOM_D]}
            material={materials.upperWall}
            receiveShadow={false}
          />
        </group>
      ))}

      <WallPanel
        position={[0, WAINSCOT_H / 2, HALF_D + WALL_T / 2]}
        size={[ROOM_W + WALL_T * 2, WAINSCOT_H, WALL_T]}
        material={materials.wainscot}
      />
      <WallPanel
        position={[0, upperY, HALF_D + WALL_T / 2]}
        size={[ROOM_W + WALL_T * 2, upperH, WALL_T]}
        material={materials.upperWall}
        receiveShadow={false}
      />

      <DoorWall materials={materials} />
    </group>
  )
}
