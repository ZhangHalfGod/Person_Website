import React, { useLayoutEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { getDoorZ, STOP_COUNT } from './cameraStops.js'
import { HEIGHT } from './corridorLayout.js'
import { applyNamedMaterials, cloneGltf, pendantMaterialFor } from './gltfShared.js'

const LIGHT_COLOR = '#ffb366'
const PENDANT_URL = '/models/ceiling_pendant.glb'
const ROD_LEN = 0.35
const SHADE_H = 0.14
const BULB_Y = -(ROD_LEN + SHADE_H / 2)
const SPOT_ANGLE = 1.18

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

function fadeFor(z) {
  if (z <= 10.25) return 1
  if (z <= 17.25) return 0.72
  return 0.45
}

function DownSpot({ intensity, castShadow }) {
  const lightRef = useRef()
  const targetRef = useRef()

  useLayoutEffect(() => {
    if (lightRef.current && targetRef.current) {
      lightRef.current.target = targetRef.current
    }
  }, [])

  return (
    <>
      <spotLight
        ref={lightRef}
        position={[0, BULB_Y, 0]}
        color={LIGHT_COLOR}
        intensity={intensity}
        distance={11}
        decay={2}
        angle={SPOT_ANGLE}
        penumbra={0.28}
        castShadow={castShadow}
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-bias={-0.004}
        shadow-normalBias={0.02}
        shadow-camera-near={0.18}
        shadow-camera-far={10}
      />
      <object3D ref={targetRef} position={[0, -HEIGHT + 0.02, 0]} />
    </>
  )
}

function EdisonBulb({ lit }) {
  return (
    <group position={[0, BULB_Y, 0]}>
      <mesh scale={[1, 1.32, 1]} position={[0, -0.012, 0]}>
        <sphereGeometry args={[0.055, 24, 18]} />
        <meshStandardMaterial
          color="#fff6e4"
          roughness={0.08}
          metalness={0.12}
          transparent
          opacity={0.38}
          envMapIntensity={1.1}
        />
      </mesh>
      <mesh scale={[1, 1.2, 1]} position={[0, -0.01, 0]}>
        <sphereGeometry args={[0.022, 14, 12]} />
        <meshStandardMaterial
          color="#ffd9a8"
          emissive={LIGHT_COLOR}
          emissiveIntensity={lit ? 5.5 : 0.12}
          toneMapped={false}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.006, 0]}>
        <torusGeometry args={[0.016, 0.0022, 8, 20]} />
        <meshStandardMaterial
          color="#ffcc88"
          emissive="#ffaa55"
          emissiveIntensity={lit ? 7 : 0.1}
          toneMapped={false}
        />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.01, 0.012, 0]}>
          <cylinderGeometry args={[0.0012, 0.0012, 0.028, 6]} />
          <meshStandardMaterial
            color="#c9a46a"
            metalness={0.85}
            roughness={0.25}
            emissive={lit ? '#ffb366' : '#000000'}
            emissiveIntensity={lit ? 0.8 : 0}
          />
        </mesh>
      ))}
      <mesh position={[0, 0.028, 0]}>
        <cylinderGeometry args={[0.012, 0.016, 0.016, 12]} />
        <meshStandardMaterial color="#6a5848" roughness={0.4} metalness={0.55} envMapIntensity={0.7} />
      </mesh>
      {[0.038, 0.046, 0.054].map((y, i) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.017 - i * 0.001, 0.018 - i * 0.001, 0.007, 16]} />
          <meshStandardMaterial color="#b0894a" roughness={0.28} metalness={0.82} envMapIntensity={1} />
        </mesh>
      ))}
      <mesh scale={[1, 1.15, 1]} position={[0, -0.01, 0]}>
        <sphereGeometry args={[0.11, 16, 12]} />
        <meshBasicMaterial
          color="#ffb366"
          transparent
          opacity={lit ? 0.16 : 0.03}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}

function Pendant({ z, lit, scene, materials }) {
  const fade = fadeFor(z)
  const clone = useMemo(() => cloneGltf(scene), [scene])
  const root = useMemo(() => clone.getObjectByName('PendantRoot') || clone, [clone])

  useLayoutEffect(() => {
    applyNamedMaterials(root, (name) => pendantMaterialFor(name, materials), {
      shadows: true
    })
    root.traverse((obj) => {
      if (!obj.isMesh) return
      if (/Cord|Inner/i.test(obj.name)) obj.castShadow = false
    })
  }, [root, materials])

  return (
    <group position={[0, HEIGHT, z]}>
      <primitive object={root} />
      <EdisonBulb lit={lit} />
      {lit ? (
        <>
          <DownSpot intensity={78 * fade} castShadow={z <= 10.25} />
          <pointLight
            position={[0, BULB_Y, 0]}
            color={LIGHT_COLOR}
            intensity={2.4 * fade}
            distance={0.22}
            decay={2}
          />
          <pointLight
            position={[0, -0.04, 0]}
            color="#e0a060"
            intensity={14 * fade}
            distance={3.4}
            decay={2}
          />
        </>
      ) : null}
    </group>
  )
}

export default function CeilingLights({ materials }) {
  const zs = lampZs()
  const { scene } = useGLTF(PENDANT_URL)

  return (
    <group>
      {zs.map((z) => (
        <Pendant key={z} z={z} lit scene={scene} materials={materials} />
      ))}
    </group>
  )
}

useGLTF.preload(PENDANT_URL)
