export interface InputSnapshot {
  left: boolean
  right: boolean
  thrust: boolean
  fire: boolean
  shield: boolean
}

export function createInput() {
  const keys = new Set<string>()
  let prevPause = false
  let prevConfirm = false
  let prevR = false

  const onDown = (e: KeyboardEvent) => {
    keys.add(e.code)
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault()
    }
  }
  const onUp = (e: KeyboardEvent) => {
    keys.delete(e.code)
  }

  window.addEventListener('keydown', onDown)
  window.addEventListener('keyup', onUp)

  const snapshot = (): InputSnapshot => ({
    left: keys.has('ArrowLeft') || keys.has('KeyA'),
    right: keys.has('ArrowRight') || keys.has('KeyD'),
    thrust: keys.has('ArrowUp') || keys.has('KeyW'),
    fire: keys.has('Space'),
    shield: keys.has('ShiftLeft') || keys.has('ShiftRight'),
  })

  const pauseEdge = (): boolean => {
    const p = keys.has('KeyP')
    const edge = p && !prevPause
    prevPause = p
    return edge
  }

  /** Space / Enter — title & gameover */
  const confirmEdge = (): boolean => {
    const c = keys.has('Space') || keys.has('Enter')
    const edge = c && !prevConfirm
    prevConfirm = c
    return edge
  }

  const restartEdge = (): boolean => {
    const r = keys.has('KeyR')
    const edge = r && !prevR
    prevR = r
    return edge
  }

  const dispose = () => {
    window.removeEventListener('keydown', onDown)
    window.removeEventListener('keyup', onUp)
  }

  return { snapshot, pauseEdge, confirmEdge, restartEdge, dispose }
}

export type InputSystem = ReturnType<typeof createInput>
