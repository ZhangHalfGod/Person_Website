import { create } from 'zustand'
import { MAX_PUSH } from '../scene/roomCameraStops.js'
import { openMechAssistConsole } from '@app/config/site.js'

export const ROOM_PHASE = {
  ENTER_DARK: 'ENTER_DARK',
  DOOR_REVEAL: 'DOOR_REVEAL',
  LIGHTS_FLICKER: 'LIGHTS_FLICKER',
  LIGHTS_STABLE: 'LIGHTS_STABLE'
}

/**
 * Painting embed advance count lives in `zoom` while `focus === 'painting'`:
 *   zoom 1 → M3 approach (camera FOCUS_VIEWS.painting[1])
 *   zoom 2 → M3 closer preview (camera [2]); still in room
 *   3rd advanceFocus('painting') → M4 openMechAssistConsole(); zoom stays 2
 * Leave painting / switch target → focus/zoom reset (count cleared).
 */
export const PAINTING_PREVIEW_MAX = 2

export const useRoomStore = create((set, get) => ({
  phase: ROOM_PHASE.ENTER_DARK,
  tableLampOn: true,
  /** @type {null | 'lamp' | 'painting' | 'blackboard' | 'bookcase'} */
  focus: null,
  /** 0 = room overview; 1..MAX_PUSH = push-ins on `focus` (painting caps preview at 2). */
  zoom: 0,
  setPhase: (phase) => set({ phase }),
  toggleTableLamp: () => set((s) => ({ tableLampOn: !s.tableLampOn })),
  advanceFocus: (id) => {
    if (!id) return
    const s = get()
    if (s.focus !== id) {
      set({ focus: id, zoom: 1 })
      return
    }
    // M4: same painting frame, already at preview max → leave room (no location until here).
    if (id === 'painting' && s.zoom >= PAINTING_PREVIEW_MAX) {
      openMechAssistConsole()
      return
    }
    if (s.zoom >= MAX_PUSH) return
    set({ zoom: s.zoom + 1 })
  },
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
