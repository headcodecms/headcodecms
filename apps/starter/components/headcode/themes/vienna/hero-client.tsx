'use client'

import { useState } from 'react'
import type { HeroData } from './hero'
import Image from 'next/image'
import type { ComponentProps } from 'react'

type ImageProps = ComponentProps<typeof Image>

export function HeroClient({ data }: { data: HeroData }) {
  const [description, setDescription] = useState(data.description)

  return (
    <div>
      <p>{description}</p>
      <p>Plans:</p>
      {data.plans.map((plan, index) => (
        <div key={index}>
          <p>{plan.plan}</p>
          <p>{plan.price}</p>
        </div>
      ))}
      <p>{data.checkbox ? 'Checkbox is true' : 'Checkbox is false'}</p>
      {data.image && (
        <Image {...(data.image as ImageProps)} alt={data.image.alt} />
      )}
      <button onClick={() => setDescription('New Description')}>
        Change Description
      </button>
    </div>
  )
}
