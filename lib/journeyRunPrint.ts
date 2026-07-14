import type { JourneySessionMode } from './types'

export interface JourneyRunPrintInput {
  title: string
  artist: string
  intent: string
  durationMinutes: number
  impactMinute?: number
  interventions: number
  mode: JourneySessionMode
}

export type JourneyRunPrintResult = 'shared' | 'downloaded' | 'cancelled'

const WIDTH = 1080
const HEIGHT = 1350

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = value.trim().split(/\s+/)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (context.measureText(candidate).width <= maxWidth || !current) {
      current = candidate
      continue
    }
    lines.push(current)
    current = word
    if (lines.length === maxLines - 1) break
  }
  if (current && lines.length < maxLines) lines.push(current)

  lines.forEach((line, index) => context.fillText(line, x, y + index * lineHeight))
}

export async function renderJourneyRunPrint(input: JourneyRunPrintInput): Promise<Blob> {
  await document.fonts?.ready
  const canvas = document.createElement('canvas')
  canvas.width = WIDTH
  canvas.height = HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('run_print_canvas_unavailable')

  const accent = input.mode === 'adaptive' ? '#c8f05a' : '#55c8ea'
  const secondary = input.mode === 'adaptive' ? '#5b2eff' : '#ff654d'
  const background = context.createLinearGradient(0, 0, WIDTH, HEIGHT)
  background.addColorStop(0, '#17141f')
  background.addColorStop(1, '#0d0c12')
  context.fillStyle = background
  context.fillRect(0, 0, WIDTH, HEIGHT)

  context.globalAlpha = 0.18
  context.fillStyle = secondary
  context.beginPath()
  context.arc(930, 90, 340, 0, Math.PI * 2)
  context.fill()
  context.globalAlpha = 1

  roundedRect(context, 72, 76, 260, 260, 16)
  context.fillStyle = secondary
  context.fill()
  context.fillStyle = accent
  context.beginPath()
  context.arc(202, 206, 72, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = '#17141f'
  context.fillRect(178, 130, 48, 152)

  context.fillStyle = 'rgba(243,239,230,.58)'
  context.font = '700 24px monospace'
  context.fillText('WOODY / RUN PRINT', 372, 118)
  context.fillStyle = '#f3efe6'
  context.font = '700 56px Syne, Arial, sans-serif'
  drawWrappedText(context, input.title || 'A Woody run', 372, 188, 620, 62, 2)
  context.fillStyle = 'rgba(243,239,230,.66)'
  context.font = '400 28px Epilogue, Arial, sans-serif'
  context.fillText(input.artist || 'Spotify journey', 372, 292)

  context.fillStyle = '#f3efe6'
  context.font = 'italic 68px Georgia, serif'
  drawWrappedText(context, input.intent || 'A run shaped in motion.', 74, 510, 900, 82, 3)

  context.strokeStyle = accent
  context.lineWidth = 12
  context.lineCap = 'round'
  context.beginPath()
  context.moveTo(-40, 1000)
  context.bezierCurveTo(170, 840, 295, 1040, 480, 750)
  context.bezierCurveTo(650, 490, 780, 900, 1135, 430)
  context.stroke()
  context.fillStyle = accent
  context.beginPath()
  context.arc(480, 750, 28, 0, Math.PI * 2)
  context.fill()
  context.strokeStyle = accent
  context.lineWidth = 3
  context.beginPath()
  context.arc(480, 750, 54, 0, Math.PI * 2)
  context.stroke()

  const metrics = [
    ['DURATION', `${input.durationMinutes} MIN`],
    ['IMPACT', input.impactMinute ? `~${input.impactMinute} MIN` : 'OPEN'],
    ['INTERVENTIONS', `${input.interventions}`],
  ]
  metrics.forEach(([label, value], index) => {
    const x = 74 + index * 326
    context.fillStyle = 'rgba(243,239,230,.52)'
    context.font = '700 21px monospace'
    context.fillText(label, x, 1130)
    context.fillStyle = index === 1 ? accent : '#f3efe6'
    context.font = '700 48px Syne, Arial, sans-serif'
    context.fillText(value, x, 1200)
  })

  context.fillStyle = 'rgba(243,239,230,.68)'
  context.font = '700 20px monospace'
  context.fillText('A JOURNEY SHAPED WITH WOODY', 74, 1292)

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('run_print_failed')), 'image/png')
  })
}

export async function shareJourneyRunPrint(blob: Blob): Promise<JourneyRunPrintResult> {
  const file = new File([blob], 'woody-run-print.png', { type: 'image/png' })
  try {
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'My Woody run', text: 'A journey shaped with Woody.' })
      return 'shared'
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'woody-run-print.png'
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
  return 'downloaded'
}
