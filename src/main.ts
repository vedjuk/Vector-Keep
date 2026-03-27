import './style.css'
import { Game } from './game/Game.ts'
import { runGameLoop } from './game/GameLoop.ts'
import { createInput } from './systems/Input.ts'

const canvas = document.querySelector<HTMLCanvasElement>('#game')
if (!canvas) throw new Error('Missing #game canvas')

const ctx = canvas.getContext('2d')
if (!ctx) throw new Error('2D context not available')

const input = createInput()
const game = new Game(canvas, ctx, input)

const stop = runGameLoop(
  (dt) => game.update(dt),
  () => game.render(),
)

window.addEventListener('beforeunload', () => {
  stop()
  game.dispose()
})
