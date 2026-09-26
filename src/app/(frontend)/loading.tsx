import { Spinner } from '@/components/ui/spinner'
import React from 'react'

export default function loading() {
  return (
    <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center">
      <Spinner />
    </div>
  )
}
