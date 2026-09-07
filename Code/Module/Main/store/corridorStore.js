import { create } from 'zustand'
import rooms from '../data/rooms.json'
import { getStopZ, getForwardLookAt, getDoorLookAt } from '../scene/cameraStops.js'

export const CAMERA_PHASE = {
  LOOK_FORWARD: 'LOOK_FORWARD',
  WALKING_FORWARD: 'WALKING_FORWARD',
  WALKING_BACK: 'WALKING_BACK',
  TURNING_TO_DOOR: 'TURNING_TO_DOOR',
  FACING_DOOR: 'FACING_DOOR',
  TURNING_BACK_FORWARD: 'TURNING_BACK_FORWARD',
  DOOR_OPENING: 'DOOR_OPENING'
}

export const STOP_COUNT = 4
export const WALK_DURATION = 1
export const TURN_DURATION = 0.75
export const DOOR_OPEN_DURATION = 1.55

const BUSY = new Set([
  CAMERA_PHASE.WALKING_FORWARD,
  CAMERA_PHASE.WALKING_BACK,
  CAMERA_PHASE.TURNING_TO_DOOR,
  CAMERA_PHASE.TURNING_BACK_FORWARD,
  CAMERA_PHASE.DOOR_OPENING
])

function lookForDoor(doorId) {
  const room = rooms.find((item) => item.id === doorId)
  if (!room) return getForwardLookAt(0)
  return getDoorLookAt(room.side, room.stopIndex)
}

export const useCorridorStore = create((set, get) => ({
  stopIndex: 0,
  cameraPhase: CAMERA_PHASE.LOOK_FORWARD,
  facingDoorId: null,
  walkFromZ: 0,
  walkToZ: 0,
  lookFrom: getForwardLookAt(0),
  lookTo: getForwardLookAt(0),
  setStopIndex: (stopIndex) => set({ stopIndex }),
  setCameraPhase: (cameraPhase) => set({ cameraPhase }),
  setFacingDoorId: (facingDoorId) => set({ facingDoorId }),
  isBusy: () => BUSY.has(get().cameraPhase),
  resetLook: () => {
    const { stopIndex } = get()
    set({
      cameraPhase: CAMERA_PHASE.LOOK_FORWARD,
      facingDoorId: null,
      lookFrom: getForwardLookAt(stopIndex),
      lookTo: getForwardLookAt(stopIndex)
    })
  },
  walkForward: () => {
    const { cameraPhase, stopIndex } = get()
    if (cameraPhase !== CAMERA_PHASE.LOOK_FORWARD) return false
    if (stopIndex >= STOP_COUNT - 1) return false
    set({
      cameraPhase: CAMERA_PHASE.WALKING_FORWARD,
      walkFromZ: getStopZ(stopIndex),
      walkToZ: getStopZ(stopIndex + 1)
    })
    return true
  },
  walkBack: () => {
    const { cameraPhase, stopIndex } = get()
    if (cameraPhase !== CAMERA_PHASE.LOOK_FORWARD) return false
    if (stopIndex <= 0) return false
    set({
      cameraPhase: CAMERA_PHASE.WALKING_BACK,
      walkFromZ: getStopZ(stopIndex),
      walkToZ: getStopZ(stopIndex - 1)
    })
    return true
  },
  onMidClick: () => {
    const { cameraPhase } = get()
    if (cameraPhase === CAMERA_PHASE.FACING_DOOR) {
      return get().turnBackForward()
    }
    return get().walkForward()
  },
  clickDoor: (room) => {
    const { cameraPhase, stopIndex, facingDoorId } = get()
    if (room.stopIndex !== stopIndex) return false
    if (BUSY.has(cameraPhase) && cameraPhase !== CAMERA_PHASE.FACING_DOOR) return false

    if (cameraPhase === CAMERA_PHASE.LOOK_FORWARD) {
      set({
        cameraPhase: CAMERA_PHASE.TURNING_TO_DOOR,
        facingDoorId: room.id,
        lookFrom: getForwardLookAt(stopIndex),
        lookTo: getDoorLookAt(room.side, room.stopIndex)
      })
      return true
    }

    if (cameraPhase === CAMERA_PHASE.FACING_DOOR) {
      if (facingDoorId === room.id) {
        set({ cameraPhase: CAMERA_PHASE.DOOR_OPENING })
        return true
      }
      set({
        cameraPhase: CAMERA_PHASE.TURNING_TO_DOOR,
        facingDoorId: room.id,
        lookFrom: lookForDoor(facingDoorId),
        lookTo: getDoorLookAt(room.side, room.stopIndex)
      })
      return true
    }

    return false
  },
  turnBackForward: () => {
    const { cameraPhase, stopIndex, facingDoorId } = get()
    if (cameraPhase !== CAMERA_PHASE.FACING_DOOR) return false
    set({
      cameraPhase: CAMERA_PHASE.TURNING_BACK_FORWARD,
      lookFrom: lookForDoor(facingDoorId),
      lookTo: getForwardLookAt(stopIndex)
    })
    return true
  },
  finishWalk: () => {
    const { cameraPhase, stopIndex } = get()
    if (cameraPhase === CAMERA_PHASE.WALKING_FORWARD) {
      set({
        stopIndex: stopIndex + 1,
        cameraPhase: CAMERA_PHASE.LOOK_FORWARD
      })
      return
    }
    if (cameraPhase === CAMERA_PHASE.WALKING_BACK) {
      set({
        stopIndex: stopIndex - 1,
        cameraPhase: CAMERA_PHASE.LOOK_FORWARD
      })
    }
  },
  finishTurn: () => {
    const { cameraPhase } = get()
    if (cameraPhase === CAMERA_PHASE.TURNING_TO_DOOR) {
      set({ cameraPhase: CAMERA_PHASE.FACING_DOOR })
      return
    }
    if (cameraPhase === CAMERA_PHASE.TURNING_BACK_FORWARD) {
      set({
        cameraPhase: CAMERA_PHASE.LOOK_FORWARD,
        facingDoorId: null
      })
    }
  }
}))

if (import.meta.env.DEV) {
  window.__corridorStore = useCorridorStore
}
