'use client'

import dynamic from 'next/dynamic'

const PopupManager = dynamic(
  () => import('@/components/popup/PopupManager').then((mod) => mod.PopupManager),
  {
    ssr: false,
    loading: () => null,
  },
)

export function DynamicPopupManager() {
  return <PopupManager />
}