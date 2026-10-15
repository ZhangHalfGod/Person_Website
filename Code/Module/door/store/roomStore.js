import { create } from 'zustand'
import { MAX_PUSH } from '../scene/roomCameraStops.js'

export const ROOM_PHASE = {
  ENTER_DARK: 'ENTER_DARK',
  DOOR_REVEAL: 'DOOR_REVEAL',
  LIGHTS_FLICKER: 'LIGHTS_FLICKER',
  LIGHTS_STABLE: 'LIGHTS_STABLE'
}

export const useRoomStore = create((set) => ({
  phase: ROOM_PHASE.ENTER_DARK,
  tableLampOn: true,
  /** @type {null | 'lamp' | 'painting' | 'blackboard' | 'bookcase'} */
  focus: null,
  /** 0 = room overview; 1..MAX_PUSH = push-ins on `focus`. */
  zoom: 0,
  setPhase: (phase) => set({ phase }),
  toggleTableLamp: () => set((s) => ({ tableLampOn: !s.tableLampOn })),
  advanceFocus: (id) =>
    set((s) => {
      if (!id) return s
      if (s.focus !== id) return { focus: id, zoom: 1 }
      if (s.zoom >= MAX_PUSH) return s
      return { zoom: s.zoom + 1 }
    }),
  retreatFocus: () =>
    set((s) => {
      if (s.zoom <= 0) return { focus: null, zoom: 0 }
      if (s.zoom === 1) return { focus: null, zoom: 0 }
      return { zoom: s.zoom - 1 }
    }),
  resetIntro: () =>
    set({
      phase: ROOM_PHASE.ENTER_DARK,
      tableLampOn: true,
      focus: null,
      zoom: 0
    })
}))

if (import.meta.env.DEV) {
  window.__roomStore = useRoomStore
}
