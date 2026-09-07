import React from 'react'
import { CAMERA_PHASE, STOP_COUNT, useCorridorStore } from '../store/corridorStore.js'

export default function ProfileHud() {
  const stopIndex = useCorridorStore((s) => s.stopIndex)
  const cameraPhase = useCorridorStore((s) => s.cameraPhase)
  const onMidClick = useCorridorStore((s) => s.onMidClick)
  const walkBack = useCorridorStore((s) => s.walkBack)

  const walking =
    cameraPhase === CAMERA_PHASE.WALKING_FORWARD ||
    cameraPhase === CAMERA_PHASE.WALKING_BACK
  const turning =
    cameraPhase === CAMERA_PHASE.TURNING_TO_DOOR ||
    cameraPhase === CAMERA_PHASE.TURNING_BACK_FORWARD
  const opening = cameraPhase === CAMERA_PHASE.DOOR_OPENING
  const facing = cameraPhase === CAMERA_PHASE.FACING_DOOR
  const atEnd = stopIndex >= STOP_COUNT - 1
  const canMid =
    (cameraPhase === CAMERA_PHASE.LOOK_FORWARD && !atEnd) || facing
  const canBack = cameraPhase === CAMERA_PHASE.LOOK_FORWARD && stopIndex > 0

  let hint = 'Click the corridor to walk forward'
  if (opening) hint = 'Opening'
  else if (turning) hint = 'Turning'
  else if (walking) {
    hint = cameraPhase === CAMERA_PHASE.WALKING_BACK ? 'Walking back' : 'Walking forward'
  } else if (facing) hint = 'Click the corridor to look forward'
  else if (atEnd) hint = 'End of the corridor'

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute left-6 top-5 text-sm tracking-wide text-white/80">
        Profile
      </div>
      <div className="absolute bottom-10 left-0 right-0 text-center">
        <button
          type="button"
          disabled={!canMid}
          onClick={() => onMidClick()}
          className={`pointer-events-auto bg-transparent text-sm ${
            canMid
              ? 'cursor-pointer text-corridor-warm/90 hover:text-corridor-warm'
              : 'cursor-default text-corridor-warm/70'
          }`}
        >
          {hint}
        </button>
        {facing ? (
          <div className="mt-2 text-xs text-white/45">Click the door again to open</div>
        ) : null}
        {canBack ? (
          <div className="pointer-events-auto mt-2 text-xs text-white/40">
            <button
              type="button"
              onClick={() => walkBack()}
              className="cursor-pointer bg-transparent hover:text-white/70"
            >
              S / click behind to walk back
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
