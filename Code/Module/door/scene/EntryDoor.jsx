import React, { useRef } from 'react'
import { DOOR_W, DOOR_H, DOOR_T, DOOR_X, DOOR_Z } from './roomLayout.js'
import { DOOR_OPEN_RAD, DOOR_START_RAD, doorOpenAmount } from './introTimeline.js'
import { useIntroTick } from './useIntroTick.js'

export default function EntryDoor({ materials, startedAt }) {
  const hingeRef = useRef()

  useIntroTick(startedAt, (t) => {
    if (hingeRef.current) {
      hingeRef.current.rotation.y = DOOR_START_RAD + DOOR_OPEN_RAD * doorOpenAmount(t)
    }
  })

  return (
    <group position={[DOOR_X, 0, DOOR_Z + 0.02]}>
      <mesh position={[0, DOOR_H + 0.045, 0.02]} material={materials.wainscot}>
        <boxGeometry args={[DOOR_W + 0.18, 0.09, 0.08]} />
      </mesh>
      <mesh position={[-(DOOR_W / 2) - 0.06, DOOR_H / 2, 0.02]} material={materials.wainscot}>
        <boxGeometry args={[0.08, DOOR_H + 0.1, 0.08]} />
      </mesh>
      <mesh position={[DOOR_W / 2 + 0.06, DOOR_H / 2, 0.02]} material={materials.wainscot}>
        <boxGeometry args={[0.08, DOOR_H + 0.1, 0.08]} />
      </mesh>

      <group ref={hingeRef} position={[DOOR_W / 2, 0, 0]}>
        <group position={[-DOOR_W / 2, DOOR_H / 2, DOOR_T / 2]} userData={{ id: 'entry-door' }}>
          <mesh castShadow receiveShadow material={materials.door}>
            <boxGeometry args={[DOOR_W, DOOR_H, DOOR_T]} />
          </mesh>
          <mesh position={[0, 0.38, DOOR_T / 2 + 0.008]} material={materials.doorPanel}>
            <boxGeometry args={[0.62, 0.72, 0.012]} />
          </mesh>
          <mesh position={[0, -0.42, DOOR_T / 2 + 0.008]} material={materials.doorPanel}>
            <boxGeometry args={[0.62, 0.72, 0.012]} />
          </mesh>
          <mesh
            position={[-DOOR_W * 0.28, -0.08, DOOR_T / 2 + 0.04]}
            material={materials.brass}
            castShadow
          >
            <sphereGeometry args={[0.04, 16, 16]} />
          </mesh>
        </group>
      </group>
    </group>
  )
}
