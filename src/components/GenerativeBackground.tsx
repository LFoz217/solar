'use client'

import { useEffect, useRef } from 'react'

// Seeded random for deterministic patterns
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PALETTE = [
  '#f59e0b', // amber-500
  '#d97706', // amber-600
  '#f97316', // orange-500
  '#ea580c', // orange-600
  '#ef4444', // red-500
  '#dc2626', // red-600
  '#fbbf24', // amber-400
  '#fb923c', // orange-400
  '#fcd34d', // amber-300
  '#c2410c', // orange-700
  '#b91c1c', // red-700
  '#78350f', // amber-900
  '#7c2d12', // orange-900
  '#fef3c7', // amber-100 (occasional bright)
  '#fed7aa', // orange-200
]

type ShapeType = 'dot' | 'cross' | 'square' | 'ring' | 'grid' | 'smallDots'

export default function GenerativeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = document.documentElement.scrollHeight * dpr
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = document.documentElement.scrollHeight + 'px'
      ctx.scale(dpr, dpr)
      draw(ctx, window.innerWidth, document.documentElement.scrollHeight)
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}

function draw(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rand = mulberry32(42)

  // Clear
  ctx.clearRect(0, 0, w, h)

  // Define the edge zones — left and right strips
  const edgeWidth = Math.min(220, w * 0.18)
  // Also add some scattered elements in the mid-border zone
  const midEdge = Math.min(340, w * 0.28)

  const totalShapes = Math.floor((h / 800) * 400)

  for (let i = 0; i < totalShapes; i++) {
    // Bias x positions toward edges
    let x: number
    const side = rand()
    if (side < 0.4) {
      // Left edge — dense
      x = rand() * edgeWidth
    } else if (side < 0.55) {
      // Left mid zone — sparser
      x = edgeWidth + rand() * (midEdge - edgeWidth)
    } else if (side < 0.7) {
      // Right mid zone — sparser
      x = w - midEdge + rand() * (midEdge - edgeWidth)
    } else {
      // Right edge — dense
      x = w - edgeWidth + rand() * edgeWidth
    }

    const y = rand() * h

    // Determine distance from nearest edge for opacity
    const distFromEdge = Math.min(x, w - x)
    const opacity = distFromEdge < edgeWidth
      ? 0.3 + rand() * 0.6
      : 0.08 + rand() * 0.2

    const color = PALETTE[Math.floor(rand() * PALETTE.length)]
    const size = 3 + rand() * 18

    // Pick shape type
    const shapes: ShapeType[] = ['dot', 'cross', 'square', 'ring', 'grid', 'smallDots']
    const shape = shapes[Math.floor(rand() * shapes.length)]

    ctx.globalAlpha = opacity

    switch (shape) {
      case 'dot':
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, size / 2, 0, Math.PI * 2)
        ctx.fill()
        break

      case 'cross':
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5 + rand() * 2
        ctx.beginPath()
        ctx.moveTo(x - size / 2, y)
        ctx.lineTo(x + size / 2, y)
        ctx.moveTo(x, y - size / 2)
        ctx.lineTo(x, y + size / 2)
        ctx.stroke()
        break

      case 'square':
        ctx.fillStyle = color
        ctx.fillRect(x - size / 2, y - size / 2, size, size)
        break

      case 'ring':
        ctx.strokeStyle = color
        ctx.lineWidth = 1 + rand() * 1.5
        ctx.beginPath()
        ctx.arc(x, y, size / 2, 0, Math.PI * 2)
        ctx.stroke()
        break

      case 'grid': {
        // Small grid of squares
        const cells = 2 + Math.floor(rand() * 3)
        const cellSize = size / cells
        ctx.fillStyle = color
        for (let gx = 0; gx < cells; gx++) {
          for (let gy = 0; gy < cells; gy++) {
            if (rand() > 0.4) {
              ctx.fillRect(
                x - size / 2 + gx * cellSize + 0.5,
                y - size / 2 + gy * cellSize + 0.5,
                cellSize - 1,
                cellSize - 1
              )
            }
          }
        }
        break
      }

      case 'smallDots': {
        // Cluster of small dots
        const count = 3 + Math.floor(rand() * 6)
        ctx.fillStyle = color
        for (let d = 0; d < count; d++) {
          const dx = x + (rand() - 0.5) * size * 1.5
          const dy = y + (rand() - 0.5) * size * 1.5
          const dr = 1 + rand() * 3
          ctx.beginPath()
          ctx.arc(dx, dy, dr, 0, Math.PI * 2)
          ctx.fill()
        }
        break
      }
    }
  }

  ctx.globalAlpha = 1
}
