const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const outDir = path.join(__dirname, '..', 'assets')

function rgba(hex, alpha = 255) {
  const clean = hex.replace('#', '')
  return [
    Number.parseInt(clean.slice(0, 2), 16),
    Number.parseInt(clean.slice(2, 4), 16),
    Number.parseInt(clean.slice(4, 6), 16),
    alpha,
  ]
}

function crc32(buffer) {
  let crc = 0xffffffff

  for (const byte of buffer) {
    crc ^= byte
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }

  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type)
  const result = Buffer.alloc(12 + data.length)
  result.writeUInt32BE(data.length, 0)
  typeBuffer.copy(result, 4)
  data.copy(result, 8)
  result.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 8 + data.length)
  return result
}

function writePng(fileName, width, height, pixels) {
  const rowLength = width * 4 + 1
  const raw = Buffer.alloc(rowLength * height)

  for (let y = 0; y < height; y += 1) {
    raw[y * rowLength] = 0
    pixels.copy(raw, y * rowLength + 1, y * width * 4, (y + 1) * width * 4)
  }

  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 6
  header[10] = 0
  header[11] = 0
  header[12] = 0

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])

  fs.writeFileSync(path.join(outDir, fileName), png)
}

function createCanvas(width, height, background) {
  const pixels = Buffer.alloc(width * height * 4)

  if (background) {
    for (let index = 0; index < width * height; index += 1) {
      pixels[index * 4] = background[0]
      pixels[index * 4 + 1] = background[1]
      pixels[index * 4 + 2] = background[2]
      pixels[index * 4 + 3] = background[3]
    }
  }

  return { width, height, pixels }
}

function blendPixel(canvas, x, y, color) {
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height || color[3] === 0) {
    return
  }

  const offset = (Math.floor(y) * canvas.width + Math.floor(x)) * 4
  const alpha = color[3] / 255
  const inverse = 1 - alpha
  const oldAlpha = canvas.pixels[offset + 3] / 255
  const nextAlpha = alpha + oldAlpha * inverse

  canvas.pixels[offset] = Math.round((color[0] * alpha + canvas.pixels[offset] * oldAlpha * inverse) / nextAlpha)
  canvas.pixels[offset + 1] = Math.round((color[1] * alpha + canvas.pixels[offset + 1] * oldAlpha * inverse) / nextAlpha)
  canvas.pixels[offset + 2] = Math.round((color[2] * alpha + canvas.pixels[offset + 2] * oldAlpha * inverse) / nextAlpha)
  canvas.pixels[offset + 3] = Math.round(nextAlpha * 255)
}

function fillRect(canvas, x, y, width, height, color) {
  const left = Math.max(0, Math.floor(x))
  const top = Math.max(0, Math.floor(y))
  const right = Math.min(canvas.width, Math.ceil(x + width))
  const bottom = Math.min(canvas.height, Math.ceil(y + height))

  for (let row = top; row < bottom; row += 1) {
    for (let col = left; col < right; col += 1) {
      blendPixel(canvas, col, row, color)
    }
  }
}

function fillCircle(canvas, cx, cy, radius, color) {
  const left = Math.floor(cx - radius)
  const top = Math.floor(cy - radius)
  const right = Math.ceil(cx + radius)
  const bottom = Math.ceil(cy + radius)
  const radiusSquared = radius * radius

  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      const dx = x + 0.5 - cx
      const dy = y + 0.5 - cy
      if (dx * dx + dy * dy <= radiusSquared) {
        blendPixel(canvas, x, y, color)
      }
    }
  }
}

function fillRoundedRect(canvas, x, y, width, height, radius, color) {
  const left = Math.floor(x)
  const top = Math.floor(y)
  const right = Math.ceil(x + width)
  const bottom = Math.ceil(y + height)
  const r = Math.min(radius, width / 2, height / 2)

  for (let row = top; row < bottom; row += 1) {
    for (let col = left; col < right; col += 1) {
      const px = col + 0.5
      const py = row + 0.5
      const dx = Math.max(x + r - px, 0, px - (x + width - r))
      const dy = Math.max(y + r - py, 0, py - (y + height - r))

      if (dx * dx + dy * dy <= r * r) {
        blendPixel(canvas, col, row, color)
      }
    }
  }
}

function drawRoundLine(canvas, x1, y1, x2, y2, thickness, color) {
  const distance = Math.hypot(x2 - x1, y2 - y1)
  const steps = Math.max(1, Math.ceil(distance / (thickness / 3)))

  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps
    fillCircle(canvas, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, thickness / 2, color)
  }
}

function downsample(canvas, scale) {
  if (scale === 1) {
    return canvas.pixels
  }

  const width = canvas.width / scale
  const height = canvas.height / scale
  const pixels = Buffer.alloc(width * height * 4)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sums = [0, 0, 0, 0]

      for (let sy = 0; sy < scale; sy += 1) {
        for (let sx = 0; sx < scale; sx += 1) {
          const offset = ((y * scale + sy) * canvas.width + (x * scale + sx)) * 4
          sums[0] += canvas.pixels[offset]
          sums[1] += canvas.pixels[offset + 1]
          sums[2] += canvas.pixels[offset + 2]
          sums[3] += canvas.pixels[offset + 3]
        }
      }

      const out = (y * width + x) * 4
      const total = scale * scale
      pixels[out] = Math.round(sums[0] / total)
      pixels[out + 1] = Math.round(sums[1] / total)
      pixels[out + 2] = Math.round(sums[2] / total)
      pixels[out + 3] = Math.round(sums[3] / total)
    }
  }

  return pixels
}

function drawMark(canvas, x, y, size) {
  const white = rgba('#FFFFFF')
  const black = rgba('#050505')
  const blue = rgba('#0B57D0')
  const softBlue = rgba('#7DD3FC')
  const green = rgba('#A7D76F')
  const rose = rgba('#F29AA0')
  const shadow = rgba('#000000', 70)

  fillRoundedRect(canvas, x + size * 0.07, y + size * 0.09, size * 0.86, size * 0.82, size * 0.13, shadow)
  fillRoundedRect(canvas, x + size * 0.09, y + size * 0.07, size * 0.82, size * 0.82, size * 0.12, white)
  fillRoundedRect(canvas, x + size * 0.09, y + size * 0.07, size * 0.82, size * 0.26, size * 0.12, blue)
  fillRect(canvas, x + size * 0.09, y + size * 0.23, size * 0.82, size * 0.12, blue)

  fillRoundedRect(canvas, x + size * 0.24, y + size * 0.02, size * 0.07, size * 0.16, size * 0.035, white)
  fillRoundedRect(canvas, x + size * 0.69, y + size * 0.02, size * 0.07, size * 0.16, size * 0.035, white)

  fillRoundedRect(canvas, x + size * 0.18, y + size * 0.42, size * 0.28, size * 0.13, size * 0.025, rose)
  fillRoundedRect(canvas, x + size * 0.52, y + size * 0.42, size * 0.28, size * 0.13, size * 0.025, rgba('#202124'))
  fillRoundedRect(canvas, x + size * 0.18, y + size * 0.60, size * 0.28, size * 0.13, size * 0.025, green)
  fillRoundedRect(canvas, x + size * 0.52, y + size * 0.60, size * 0.28, size * 0.13, size * 0.025, softBlue)

  fillCircle(canvas, x + size * 0.76, y + size * 0.73, size * 0.17, blue)
  drawRoundLine(canvas, x + size * 0.76, y + size * 0.73, x + size * 0.76, y + size * 0.64, size * 0.025, white)
  drawRoundLine(canvas, x + size * 0.76, y + size * 0.73, x + size * 0.84, y + size * 0.77, size * 0.025, white)
  fillCircle(canvas, x + size * 0.76, y + size * 0.73, size * 0.025, white)

  drawRoundLine(canvas, x + size * 0.28, y + size * 0.19, x + size * 0.40, y + size * 0.25, size * 0.025, white)
  drawRoundLine(canvas, x + size * 0.40, y + size * 0.25, x + size * 0.55, y + size * 0.15, size * 0.025, white)
  fillCircle(canvas, x + size * 0.28, y + size * 0.19, size * 0.018, black)
}

function render(fileName, size, options) {
  const scale = options.scale ?? 2
  const canvas = createCanvas(size * scale, size * scale, options.background ? rgba(options.background) : null)
  const unit = size * scale

  if (options.fullIcon) {
    fillRoundedRect(canvas, unit * 0.05, unit * 0.05, unit * 0.9, unit * 0.9, unit * 0.2, rgba('#06070A'))
    fillCircle(canvas, unit * 0.18, unit * 0.15, unit * 0.35, rgba('#0B57D0', 35))
    fillCircle(canvas, unit * 0.86, unit * 0.88, unit * 0.34, rgba('#7DD3FC', 24))
  }

  const markSize = unit * options.markScale
  drawMark(canvas, (unit - markSize) / 2, (unit - markSize) / 2 + unit * (options.offsetY ?? 0), markSize)
  writePng(fileName, size, size, downsample(canvas, scale))
}

fs.mkdirSync(outDir, { recursive: true })

render('icon.png', 1024, { background: '#000000', fullIcon: true, markScale: 0.74, scale: 2 })
render('adaptive-icon.png', 1024, { markScale: 0.62, scale: 2 })
render('splash-icon.png', 1024, { markScale: 0.42, scale: 2 })
render('favicon.png', 256, { background: '#000000', fullIcon: true, markScale: 0.74, scale: 3 })

console.log('Generated app assets in assets/')
