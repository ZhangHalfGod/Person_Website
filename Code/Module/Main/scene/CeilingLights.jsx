import React from 'react'
import { getDoorZ, STOP_COUNT } from './cameraStops.js'
import { HEIGHT } from './corridorLayout.js'

const LIGHT_COLOR = '#ffb366'
const PENDANT_Y = HEIGHT - 0.42

function lampZs() {
  const zs = [1.15]
  for (let i = 0; i < STOP_COUNT; i += 1) {
    zs.push(getDoorZ(i))
    if (i < STOP_COUNT - 1) {
      zs.push((getDoorZ(i) + getDoorZ(i + 1)) / 2)
    }
  }
  zs.push(getDoorZ(STOP_COUNT - 1) + 4.2)
  return zs
}

const POINT_LIGHT_Z = new Set([1.15, ...Array.from({ length: STOP_COUNT }, (_, i) => getDoorZ(i))])

function Pendant({ z, lit }) {
  return (
    <group position={[0, PENDANT_Y, z]}>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.38, 8]} />
        <meshStandardMaterial color="#1a1410" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.16, 0.2, 16]} />
        <meshStandardMaterial
          color="#3a2a18"
          roughness={0.45}
          metalness={0.25}
          emissive={lit ? LIGHT_COLOR : '#000000'}
          emissiveIntensity={lit ? 0.35 : 0}
        />
      </mesh>
      <mesh position={[0, -0.06, 0]}>
        <sphereGeometry args={[0.045, 12, 12]} />
        <meshStandardMaterial
          color="#ffd9a8"
          emissive={LIGHT_COLOR}
          emissiveIntensity={lit ? 1.4 : 0.15}
          toneMapped={false}
        />
      </mesh>
      {lit ? (
        <pointLight
          color={LIGHT_COLOR}
          intensity={36}
          distance={13}
          decay={2}
          castShadow={z < getDoorZ(1)}
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          shadow-bias={-0.01}
        />
      ) : null}
    </group>
  )
}

export default function CeilingLights() {
  const zs = lampZs()

  return (
    <group>
      {zs.map((z) => (
        <Pendant key={z} z={z} lit={POINT_LIGHT_Z.has(z)} />
      ))}
    </group>
  )
}
