import React, { useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { PMREMGenerator, Scene as ThreeScene, Mesh, SphereGeometry, MeshBasicMaterial, BackSide } from 'three'
import { STOP_COUNT } from './cameraStops.js'
import { useCorridorMaterials } from './useCorridorMaterials.js'
import Corridor from './Corridor.jsx'
import DoorPair from './DoorPair.jsx'
import CeilingLights from './CeilingLights.jsx'
import SceneCamera, { WalkHitboxes } from './WalkControls.jsx'

const FOG = '#120e0c'

function WarmBounceEnv() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)

  useLayoutEffect(() => {
    const pmrem = new PMREMGenerator(gl)
    const envScene = new ThreeScene()
    envScene.add(
      new Mesh(
        new SphereGeometry(1, 16, 12),
        new MeshBasicMaterial({ color: '#5a3c28', side: BackSide })
      )
    )
    const envMap = pmrem.fromScene(envScene, 0.06).texture
    scene.environment = envMap
    scene.environmentIntensity = 0.32
    envScene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) obj.material.dispose()
    })
    return () => {
      scene.environment = null
      envMap.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])

  return null
}

export default function CorridorScene() {
  const materials = useCorridorMaterials()

  return (
    <>
      <color attach="background" args={[FOG]} />
      <fog attach="fog" args={[FOG, 14, 44]} />
      <ambientLight intensity={0.22} color="#3a281c" />
      <hemisphereLight color="#3a2a20" groundColor="#8a7868" intensity={0.55} />
      <WarmBounceEnv />
      <SceneCamera />
      <Corridor materials={materials} />
      {Array.from({ length: STOP_COUNT }, (_, stopIndex) => (
        <DoorPair key={stopIndex} stopIndex={stopIndex} materials={materials} />
      ))}
      <CeilingLights materials={materials} />
      <WalkHitboxes />
    </>
  )
}
