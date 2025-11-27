import { rgbaToThumbHash, thumbHashToDataURL } from 'thumbhash'
import type { ImageSize } from './types'

export const defaultBlurDataURL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAQxklEQVR4AQCBAH7/AJ+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/AIEAfv8An6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv8AgQB+/wCfo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/wCBAH7/AJ+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/AIEAfv8An6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv8AgQB+/wCfo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/wCBAH7/AJ+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/AIEAfv8An6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv8AgQB+/wCfo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/wCBAH7/AJ+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/AIEAfv8An6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv8AgQB+/wCfo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/wCBAH7/AJ+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/AIEAfv8An6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv8AgQB+/wCfo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/wCBAH7/AJ+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/AIEAfv8An6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv8AgQB+/wCfo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/wCBAH7/AJ+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/AIEAfv8An6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv8AgQB+/wCfo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/wCBAH7/AJ+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/AIEAfv8An6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv8AgQB+/wCfo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/wCBAH7/AJ+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/AIEAfv8An6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv8AgQB+/wCfo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/wCBAH7/AJ+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/AIEAfv8An6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv8AgQB+/wCfo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/wCBAH7/AJ+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/AYEAfv8An6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv+fo67/n6Ou/5+jrv8FcbymNRhPygAAAABJRU5ErkJggg=='

export const calculateSize = (image: ImageSize, min: ImageSize): ImageSize => {
  const ratio = Math.min(
    Math.max(image.width / min.width, 1.0),
    Math.max(image.height / min.height, 1.0),
  )

  return {
    width: Math.round(image.width / ratio),
    height: Math.round(image.height / ratio),
  }
}

export const calculateImageProps = (image: HTMLImageElement) => {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  let thumbHash: string | null = null

  if (context) {
    const scale = 100 / Math.max(image.width, image.height)
    canvas.width = Math.round(image.width * scale)
    canvas.height = Math.round(image.height * scale)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
    const binaryThumbHash = rgbaToThumbHash(
      pixels.width,
      pixels.height,
      pixels.data,
    )
    thumbHash = thumbHashToDataURL(binaryThumbHash)
  }

  return {
    width: image.naturalWidth,
    height: image.naturalHeight,
    blurDataURL: thumbHash ?? defaultBlurDataURL,
  }
}

export const compactNumber = (number: number) => {
  const formatter = Intl.NumberFormat('en', {
    notation: 'compact',
    style: 'unit',
    unit: 'byte',
    unitDisplay: 'narrow',
  })
  return formatter.format(number)
}

export function generateUniqueImageName(name: string) {
  const cleanName = name.replace(/\s+/g, '-').toLowerCase()
  const suffix = Math.floor(Math.random() * Date.now()).toString(36)
  const index = cleanName.lastIndexOf('.')

  return index < 0
    ? `${cleanName}-${suffix}`
    : `${cleanName.slice(0, index)}-${suffix}${cleanName.slice(index)}`
}
