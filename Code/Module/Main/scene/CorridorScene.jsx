import React from 'react'
import { STOP_COUNT } from './cameraStops.js'
import { useCorridorMaterials } from './useCorridorMaterials.js'
import Corridor from './Corridor.jsx'
import DoorPair from './DoorPair.jsx'
import CeilingLights from './CeilingLights.jsx'
import SceneCamera, { WalkHitboxes } from './WalkControls.jsx'

const FOG = '#07080b'

export default function CorridorScene() {
  const materials = useCorridorMaterials()

  return (
    <>
      <color attach="background" args={[FOG]} />
      <fog attach="fog" args={[FOG, 10, 38]} />
      <ambientLight intensity={0.08} color="#2a1c12" />
      <SceneCamera />
      <Corridor materials={materials} />
      {Array.from({ length: STOP_COUNT }, (_, stopIndex) => (
        <DoorPair key={stopIndex} stopIndex={stopIndex} materials={materials} />
      ))}
      <CeilingLights />
      <WalkHitboxes />
    </>
  )
}
