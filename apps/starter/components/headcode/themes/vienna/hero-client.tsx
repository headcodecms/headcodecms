'use client'

import { useState } from 'react'

export function HeroClient({ data }: { data: unknown }) {
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
