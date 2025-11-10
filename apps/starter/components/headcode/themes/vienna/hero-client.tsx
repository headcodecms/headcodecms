'use client'

import type { HeroSection } from '@/components/headcode/vienna/hero'
import { useEffect, useState } from 'react'

export function HeroClient({ section }: { section: HeroSection }) {
  const [description, setDescription] = useState('')

  useEffect(() => {
    setDescription(section.description)
  }, [section.description])
  return (
    <div>
      <p>{description}</p>
    </div>
  )
}
