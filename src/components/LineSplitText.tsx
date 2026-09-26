'use client'
import React, { useEffect, useRef } from 'react'
import { useInView } from 'framer-motion'

interface LineSplitTextProps {
  children: React.ReactNode
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'
  className?: string
}

const LineSplitText = ({ children, tag = 'h1', className = '' }: LineSplitTextProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, amount: 0.1 })
  const hasSplit = useRef(false)

  const Tag = tag

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined' || hasSplit.current) return
    if (!isInView) return

    hasSplit.current = true

    const element = containerRef.current

    if (element.getAttribute('data-split-done')) return

    const doSplit = async () => {
      try {
        const SplitTypeModule = await import('split-type')
        const SplitType = SplitTypeModule.default
        
        const splitter = new SplitType(element, { types: 'lines', absolute: true })

        if (!splitter.lines?.length) return

        element.setAttribute('data-split-done', 'true')

        const lineElements: HTMLSpanElement[] = []

        splitter.lines.forEach((line: Element, i: number) => {
          const wrapper = document.createElement('span')
          wrapper.className = 'split-line-wrapper'
          wrapper.style.display = 'block'
          wrapper.style.overflow = 'hidden'
          
          const inner = document.createElement('span')
          inner.className = 'split-line-inner'
          inner.style.display = 'block'
          inner.style.transform = 'translateY(110%)'
          inner.style.transition = `transform 0.7s cubic-bezier(0.25, 0.1, 0.25, 1) ${i * 0.08}s`
          
          lineElements.push(inner)
          
          if (line.parentNode) {
            line.parentNode.replaceChild(wrapper, line)
            wrapper.appendChild(inner)
            inner.appendChild(line)
          }
        })

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            lineElements.forEach((inner) => {
              inner.style.transform = 'translateY(0%)'
            })
          })
        })

      } catch (e) {
        console.error('SplitType error:', e)
      }
    }

    const timer = setTimeout(doSplit, 50)
    return () => clearTimeout(timer)
  }, [isInView])

  return (
    <Tag ref={containerRef} className={`relative ${className}`}>
      {children}
    </Tag>
  )
}

export default LineSplitText