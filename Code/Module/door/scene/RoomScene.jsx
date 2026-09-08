import React, { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useRoomMaterials } from './useRoomMaterials.js'
import RoomInterior from './RoomInterior.jsx'
import EntryDoor from './EntryDoor.jsx'
import FlickerLights from './FlickerLights.jsx'
import Furniture from './Furniture.jsx'
import TableLamp from './TableLamp.jsx'
import Painting from './Painting.jsx'
import Blackboard from './Blackboard.jsx'
import { CAM_LOOK, CAM_POS } from './roomLayout.js'

const FOG = '#07080b'

function RoomCamera() {
  const camera = useThree((state) => state.camera)

  useFrame(() => {
    camera.up.set(0, 1, 0)
    camera.position.set(CAM_POS[0], CAM_POS[1], CAM_POS[2])
    camera.lookAt(CAM_LOOK[0], CAM_LOOK[1], CAM_LOOK[2])
  })

  return null
}

export default function RoomScene() {
  const materials = useRoomMaterials()
  const startedAt = useMemo(() => performance.now(), [])

  return (
    <>
      <color attach="background" args={[FOG]} />
      <fog attach="fog" args={[FOG, 12, 22]} />
      <RoomCamera />
      <RoomInterior materials={materials} />
      <EntryDoor materials={materials} startedAt={startedAt} />
      <FlickerLights startedAt={startedAt} />
      <Furniture materials={materials} />
      <TableLamp materials={materials} startedAt={startedAt} />
      <Painting materials={materials} />
      <Blackboard materials={materials} />
    </>
  )
}
