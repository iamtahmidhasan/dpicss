import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export const runtime = 'nodejs'

const TEMPLATE_PATH = 'public/offcial-member-poster-img.png'

const AVATAR_ZOOM = 1.55
const AVATAR_CENTER_X = 620
const ID_CENTER_X = 630
const AVATAR_CENTER_Y = 740
const AVATAR_RADIUS = 153
const AVATAR_SIZE = AVATAR_RADIUS * 2
const AVATAR_ZOOMED_SIZE = Math.round(AVATAR_SIZE * AVATAR_ZOOM)
const AVATAR_ZOOMED_LEFT = AVATAR_CENTER_X - Math.round(AVATAR_ZOOMED_SIZE / 2)
const AVATAR_ZOOMED_TOP = AVATAR_CENTER_Y - Math.round(AVATAR_ZOOMED_SIZE / 2)

const NAME_Y = 1030
const ID_Y = 1135
const TEMPLATE_WIDTH = 1254
const TEMPLATE_HEIGHT = 1254

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + '\u2026'
}

let fontBase64Cache: { semiBold: string; bold: string } | null = null

async function loadFontBase64(): Promise<{ semiBold: string; bold: string } | null> {
  if (fontBase64Cache) return fontBase64Cache

  const fontDir = path.join(process.cwd(), 'public', 'font')
  try {
    const [semiBold, bold] = await Promise.all([
      fs.readFile(path.join(fontDir, 'Poppins-SemiBold.ttf')),
      fs.readFile(path.join(fontDir, 'Poppins-Bold.ttf')),
    ])
    fontBase64Cache = {
      semiBold: semiBold.toString('base64'),
      bold: bold.toString('base64'),
    }
    return fontBase64Cache
  } catch {
    return null
  }
}

function generateTextOverlay(
  name: string,
  memberId: string,
  fonts: { semiBold: string; bold: string } | null,
): string {
  const displayName = truncate(name, 28)
  const escapedName = escapeXml(displayName)
  const escapedId = escapeXml(memberId)

  const styleBlock = fonts
    ? `<style>
    @font-face {
      font-family: 'Poppins-SemiBold';
      src: url('data:font/ttf;base64,${fonts.semiBold}') format('truetype');
      font-weight: 600;
      font-style: normal;
    }
    @font-face {
      font-family: 'Poppins-Bold';
      src: url('data:font/ttf;base64,${fonts.bold}') format('truetype');
      font-weight: 700;
      font-style: normal;
    }
  </style>`
    : ''

  const idLine = escapedId
    ? `<text x="${ID_CENTER_X}" y="${ID_Y}" text-anchor="middle" font-family="${fonts ? 'Poppins-SemiBold,' : ''}Arial,Helvetica,sans-serif" font-weight="600" font-size="45" fill="#000000">${escapedId}</text>`
    : ''

  return `<svg width="${TEMPLATE_WIDTH}" height="${TEMPLATE_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  ${styleBlock}
  <text x="${AVATAR_CENTER_X}" y="${NAME_Y}" text-anchor="middle" font-family="${fonts ? 'Poppins-Bold,' : ''}Arial,Helvetica,sans-serif" font-weight="700" text-transform="uppercase" font-size="60" fill="#0a2463">${escapedName}</text>
  ${idLine}
</svg>`
}

async function fetchImageBuffer(url: string, origin: string): Promise<Buffer | null> {
  try {
    const src = url.startsWith('http') ? url : `${origin}${url}`
    const resp = await fetch(src, { signal: AbortSignal.timeout(5_000) })
    if (!resp.ok) return null
    const arrayBuffer = await resp.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch {
    return null
  }
}

let templateCache: Buffer | null = null

async function loadTemplate(origin?: string): Promise<Buffer | null> {
  if (templateCache) return templateCache

  // Try filesystem first
  try {
    const templatePath = path.join(process.cwd(), TEMPLATE_PATH)
    const buf = await fs.readFile(templatePath)
    templateCache = buf
    return buf
  } catch {
    // Fallback: fetch from public URL (works on Vercel)
  }

  if (origin) {
    try {
      const resp = await fetch(`${origin}/offcial-member-poster.png`, {
        signal: AbortSignal.timeout(5_000),
      })
      if (resp.ok) {
        const buf = Buffer.from(await resp.arrayBuffer())
        templateCache = buf
        return buf
      }
    } catch {
      // ignore
    }
  }

  return null
}

export async function POST(req: NextRequest) {
  let sharp: any
  try {
    sharp = (await import('sharp')).default
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('Sharp load error:', msg)
    return NextResponse.json(
      { error: `Image library unavailable on server: ${msg}` },
      { status: 500 },
    )
  }

  try {
    const { memberId, firstName, lastName, avatarUrl } = await req.json()

    const name = [firstName, lastName].filter(Boolean).join(' ').trim() || 'Member'
    const displayId = memberId || ''

    const template = await loadTemplate(req.nextUrl.origin)
    if (!template) {
      return NextResponse.json({ error: 'Poster template not found' }, { status: 500 })
    }

    const composites: { input: Buffer; top: number; left: number }[] = []

    if (avatarUrl) {
      const avatarBuffer = await fetchImageBuffer(avatarUrl, req.nextUrl.origin)
      if (avatarBuffer && avatarBuffer.length > 0) {
        let zoomedAvatar: Buffer
        try {
          zoomedAvatar = await sharp(avatarBuffer)
            .resize(AVATAR_ZOOMED_SIZE, AVATAR_ZOOMED_SIZE, { fit: 'cover', position: 'centre' })
            .png()
            .toBuffer()
        } catch (e) {
          console.error('Avatar processing error:', e)
          throw e
        }

        const avatarLayer = await sharp({
          create: {
            width: TEMPLATE_WIDTH,
            height: TEMPLATE_HEIGHT,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          },
        })
          .composite([{ input: zoomedAvatar, top: AVATAR_ZOOMED_TOP, left: AVATAR_ZOOMED_LEFT }])
          .png()
          .toBuffer()

        composites.push({ input: avatarLayer, top: 0, left: 0 })
      }
    }

    const fonts = await loadFontBase64()
    const textOverlay = Buffer.from(generateTextOverlay(name, displayId, fonts))
    composites.push({ input: template, top: 0, left: 0 })
    // composites.push({ input: textOverlay, top: 0, left: 0 })

    const result = await sharp({
      create: {
        width: TEMPLATE_WIDTH,
        height: TEMPLATE_HEIGHT,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite(composites)
      .png()
      .toBuffer()

    return new NextResponse(result, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="dpirc-${memberId || 'poster'}.png"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Poster generation error:', error)
    try {
      return NextResponse.json({ error: msg }, { status: 500 })
    } catch {
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }
}
