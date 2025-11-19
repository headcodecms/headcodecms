'use client'

import { useState } from 'react'
import type { HeroData } from './hero'

export function HeroClient({ data }: { data: HeroData }) {
  const [description, setDescription] = useState(data.description)

  return (
    <div>
      <p>{description}</p>
      <button onClick={() => setDescription('New Description')}>
        Change Description
      </button>
    </div>
  )
}
