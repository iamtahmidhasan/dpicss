import sharp from 'sharp'
import path from 'path'

const projectRoot = process.cwd()
const publicDir = path.join(projectRoot, 'public')
const iconsDir = path.join(publicDir, 'icons')

const sourceImage = path.join(publicDir, 'DPI_Robotics_club.webp')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

async function generateIcons() {
  try {
    console.log('Reading source image from:', sourceImage)
    const inputBuffer = await sharp(sourceImage).toBuffer()

    for (const size of sizes) {
      const filename = `icon-${size}x${size}.png`
      await sharp(inputBuffer)
        .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(path.join(iconsDir, filename))
      console.log(`Generated ${filename}`)

      const maskFilename = `icon-${size}x${size}-maskable.png`
      await sharp(inputBuffer)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(path.join(iconsDir, maskFilename))
      console.log(`Generated ${maskFilename}`)
    }

    console.log('All icons generated successfully!')
  } catch (error) {
    console.error('Error generating icons:', error)
    process.exit(1)
  }
}

generateIcons()