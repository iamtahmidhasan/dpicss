'use client'

import React, { useEffect, useRef } from 'react'
import createGlobe from 'cobe'
import { cn } from '@/lib/utils'

interface EarthProps {
  className?: string
  theta?: number
  dark?: number
  scale?: number
  diffuse?: number
  mapSamples?: number
  mapBrightness?: number
  baseColor?: [number, number, number]
  markerColor?: [number, number, number]
  glowColor?: [number, number, number]
}

const Earth: React.FC<EarthProps> = ({
  className,
  theta = 0.25,
  dark = 1,
  scale = 1.1,
  diffuse = 1.2,
  mapSamples = 40000,
  mapBrightness = 6,
  baseColor = [0.4, 0.6509, 1],
  markerColor = [1, 0, 0],
  glowColor = [0.2745, 0.5765, 0.898],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let width = 0
    const onResize = () => {
      if (!canvasRef.current) return
      width = canvasRef.current.offsetWidth
    }

    window.addEventListener('resize', onResize)
    onResize()

    let phi = 0
    const globe = createGlobe(canvasRef.current!, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta,
      dark,
      scale,
      diffuse,
      mapSamples,
      mapBrightness,
      baseColor,
      markerColor,
      glowColor,
      opacity: 1,
      offset: [0, 0],
      markers: [],
      onRender: () => {
        phi += 0.003
        return { phi }
      },
    } as any)

    return () => {
      globe.destroy()
      window.removeEventListener('resize', onResize)
    }
  }, [dark, diffuse, glowColor, mapBrightness, mapSamples, scale, baseColor, markerColor, theta])

  return (
    <div className={cn('flex items-center justify-center w-full', className)}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', maxWidth: '100%', aspectRatio: '1' }}
      />
    </div>
  )
}

export default Earth
