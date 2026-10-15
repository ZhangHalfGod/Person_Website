import { BOARD, CAM_Y, HALF_D, HALF_W, PAINTING, TABLE_LAMP } from './roomLayout.js'

/** Max push-ins from the room overview (levels 1..MAX_PUSH). */
export const MAX_PUSH = 3

/** Default full-room shot (enter / zoom 0). */
export const ROOM_VIEW = {
  pos: [0.55, CAM_Y, -HALF_D + 0.62],
  look: [0.08, 1.13, 2.05],
  fov: 72
}

const PAINT_X = HALF_W - 0.055
const PAINT_Y = PAINTING.y
const PAINT_Z = PAINTING.z

const BOARD_X = -HALF_W + 0.055
const BOARD_Y = BOARD.y
const BOARD_Z = BOARD.z

const CASE_X = 1.85
const CASE_Z = HALF_D - 0.22
const CASE_Y = 1.35

const LAMP_X = TABLE_LAMP.x
const LAMP_Y = TABLE_LAMP.y
const LAMP_Z = TABLE_LAMP.z

/**
 * Per-focus shots indexed by push level 1..3.
 * 1 = stand beside / approach
 * 2 = face-to-face
 * 3 = detail close-up
 */
export const FOCUS_VIEWS = {
  painting: {
    1: {
      pos: [PAINT_X - 1.15, PAINT_Y - 0.05, PAINT_Z + 0.85],
      look: [PAINT_X, PAINT_Y, PAINT_Z],
      fov: 58
    },
    2: {
      pos: [PAINT_X - 1.35, PAINT_Y, PAINT_Z],
      look: [PAINT_X, PAINT_Y, PAINT_Z],
      fov: 48
    },
    3: {
      pos: [PAINT_X - 0.72, PAINT_Y + 0.02, PAINT_Z],
      look: [PAINT_X, PAINT_Y, PAINT_Z],
      fov: 40
    }
  },
  /** Right-wall board (screen-right / world -X). */
  blackboard: {
    1: {
      pos: [BOARD_X + 1.15, BOARD_Y - 0.05, BOARD_Z - 0.9],
      look: [BOARD_X, BOARD_Y, BOARD_Z],
      fov: 58
    },
    2: {
      pos: [BOARD_X + 1.45, BOARD_Y, BOARD_Z],
      look: [BOARD_X, BOARD_Y, BOARD_Z],
      fov: 48
    },
    3: {
      pos: [BOARD_X + 0.78, BOARD_Y + 0.02, BOARD_Z],
      look: [BOARD_X, BOARD_Y, BOARD_Z],
      fov: 40
    }
  },
  bookcase: {
    1: {
      pos: [CASE_X - 0.95, 1.42, CASE_Z - 1.35],
      look: [CASE_X, CASE_Y, CASE_Z],
      fov: 58
    },
    2: {
      pos: [CASE_X, 1.48, CASE_Z - 1.55],
      look: [CASE_X, CASE_Y + 0.05, CASE_Z],
      fov: 48
    },
    3: {
      pos: [CASE_X + 0.05, 1.55, CASE_Z - 0.78],
      look: [CASE_X, 1.5, CASE_Z],
      fov: 40
    }
  },
  lamp: {
    1: {
      pos: [LAMP_X - 0.95, 1.38, LAMP_Z - 1.25],
      look: [LAMP_X, LAMP_Y + 0.22, LAMP_Z],
      fov: 55
    },
    2: {
      pos: [LAMP_X - 0.55, LAMP_Y + 0.42, LAMP_Z - 0.72],
      look: [LAMP_X - 0.04, LAMP_Y + 0.26, LAMP_Z + 0.06],
      fov: 48
    },
    3: {
      pos: [LAMP_X - 0.28, LAMP_Y + 0.34, LAMP_Z - 0.38],
      look: [LAMP_X + 0.02, LAMP_Y + 0.28, LAMP_Z + 0.02],
      fov: 40
    }
  }
}

export function getCameraStop(focus, zoom) {
  if (!focus || zoom <= 0) return ROOM_VIEW
  const shots = FOCUS_VIEWS[focus]
  return shots?.[zoom] || ROOM_VIEW
}
