import sharp from 'sharp'
import path from 'path'

const projectRoot = process.cwd()
const publicDir = path.join(projectRoot, 'public')
const iconsDir = path.join(publicDir, 'icons')
const appDir = path.join(projectRoot, 'src', 'app')

const sourceImage = path.join(publicDir, 'dpicslogo.png')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

const MASKABLE_INSET_RATIO = 0.8
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 }

const rootIcons = [
  { file: path.join(publicDir, 'favicon.png'), size: 192 },
  { file: path.join(appDir, 'icon.png'), size: 512 },
  { file: path.join(appDir, 'favicon.png'), size: 512 },
]

const render = (input, size, { maskable = false } = {}) => {
  const inner = Math.max(1, Math.round(size * (maskable ? MASKABLE_INSET_RATIO : 1)))
  const pad = size - inner

  return sharp(input)
    .resize(inner, inner, { fit: 'contain' })
    .extend({
      top: Math.floor(pad / 2),
      bottom: Math.ceil(pad / 2),
      left: Math.floor(pad / 2),
      right: Math.ceil(pad / 2),
      background: WHITE,
    })
    .png()
}

async function generateIcons() {
  try {
    console.log('Reading source image from:', sourceImage)
    const inputBuffer = await sharp(sourceImage).toBuffer()

    for (const size of sizes) {
      const filename = `icon-${size}x${size}.png`
      await render(inputBuffer, size).toFile(path.join(iconsDir, filename))
      console.log(`Generated ${filename}`)

      const maskFilename = `icon-${size}x${size}-maskable.png`
      await render(inputBuffer, size, { maskable: true }).toFile(path.join(iconsDir, maskFilename))
      console.log(`Generated ${maskFilename}`)
    }

    for (const { file, size } of rootIcons) {
      await render(inputBuffer, size).toFile(file)
      console.log(`Generated ${path.relative(projectRoot, file)}`)
    }

    console.log('All icons generated successfully!')
  } catch (error) {
    console.error('Error generating icons:', error)
    process.exit(1)
  }
}

generateIcons()
