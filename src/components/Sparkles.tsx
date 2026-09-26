'use client'

import { useCallback } from 'react'
import Particles from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { cn } from '@/lib/utils'

type SparklesProps = {
  className?: string
  density?: number
  speed?: number
  color?: string
  direction?: 'top' | 'bottom' | 'left' | 'right'
}

const Sparkles = ({
  className,
  density = 1800,
  speed = 1,
  color = '#48b6ff',
  direction = 'top',
}: SparklesProps) => {
  const particlesLoaded = useCallback(async (_container: any) => {
    return
  }, [])

  const options: any = {
    fullScreen: {
      enable: false,
    },
    particles: {
      number: {
        value: Math.max(10, Math.round(density / 60)),
        density: {
          enable: true,
          width: 800,
          height: 800,
        },
      },
      color: {
        value: color,
      },
      move: {
        enable: true,
        direction,
        speed,
        outModes: {
          default: 'out',
        },
      },
      opacity: {
        value: 0.55,
        animation: {
          enable: true,
          speed: 0.8,
          sync: false,
        },
      },
      size: {
        value: { min: 1, max: 3 },
      },
      shape: {
        type: 'circle',
      },
      links: {
        enable: false,
      },
    },
    interactivity: {
      detectsOn: 'canvas',
      events: {
        resize: {
          enable: true,
          delay: 0,
        },
      },
    },
    detectRetina: true,
  }

  return (
    <Particles
      id="hero-sparkles"
      className={cn('h-full w-full', className)}
      particlesLoaded={particlesLoaded}
      options={options}
    />
  )
}

export default Sparkles
