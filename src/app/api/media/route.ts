import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { getPayloadWithRetry } from '@/lib/payload-safe'
import { getCurrentUser } from '@/lib/payload-auth'
import { cleanupOldMedia } from '@/lib/media-cleanup'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_WIDTH = 1200
const MAX_HEIGHT = 1200
const WEBP_QUALITY = 85

async function compressImage(buffer: Buffer): Promise<Buffer> {
  const image = sharp(buffer)
  const metadata = await image.metadata()

  let processed = image

  if (metadata.width && metadata.height) {
    if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
      const ratio = Math.min(MAX_WIDTH / metadata.width, MAX_HEIGHT / metadata.height)
      processed = image.resize({
        width: Math.round(metadata.width * ratio),
        height: Math.round(metadata.height * ratio),
        fit: 'inside',
        withoutEnlargement: true,
      })
    }
  }

  return processed.webp({ quality: WEBP_QUALITY }).toBuffer()
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayloadWithRetry()
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const replaceMediaId = formData.get('replaceMediaId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB after compression' },
        { status: 400 },
      )
    }

    const isImage = file.type.startsWith('image/')
    let processedBuffer: Buffer
    let finalFilename: string
    let finalMimeType = 'image/webp'

    if (isImage) {
      const originalBuffer = Buffer.from(await file.arrayBuffer())
      processedBuffer = await compressImage(originalBuffer)
      const baseName = file.name.replace(/\.[^.]+$/, '')
      finalFilename = `${baseName}-${Date.now()}.webp`
    } else {
      processedBuffer = Buffer.from(await file.arrayBuffer())
      finalFilename = file.name
      finalMimeType = file.type
    }

    const title = formData.get('title') as string || file.name
    const alt = formData.get('alt') as string || title
    const usage = formData.get('usage') as string || 'general'

    const doc = await payload.create({
      collection: 'media',
      data: {
        title,
        alt,
        usage: usage === 'course' || usage === 'post' || usage === 'profile' || usage === 'thumbnail' || usage === 'banner' || usage === 'icon' || usage === 'certificate' ? usage : 'general',
        filename: finalFilename,
        mimeType: finalMimeType,
        fileSize: processedBuffer.length,
      },
      file: {
        data: processedBuffer,
        name: finalFilename,
        mimetype: finalMimeType,
        size: processedBuffer.length,
      },
      user: user,
      overrideAccess: false,
    })

    if (replaceMediaId) {
      await cleanupOldMedia(replaceMediaId, doc.id)
    }

    return NextResponse.json({
      doc,
      id: doc.id,
      compressed: isImage,
      originalSize: file.size,
      compressedSize: processedBuffer.length,
      compressionRatio: isImage ? Math.round((1 - processedBuffer.length / file.size) * 100) : 0,
      cleanedUp: Boolean(replaceMediaId),
    })
  } catch (error) {
    console.error('Media upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload media', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}