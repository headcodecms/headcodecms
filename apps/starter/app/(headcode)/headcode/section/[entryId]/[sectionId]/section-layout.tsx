'use client'

import { useState } from 'react'
import type { Entry, Section } from '@/lib/headcode/types'
import { Form } from './form'
import { Sidebar } from './sidebar'
import type { AppFormInstance } from '@/components/headcode/form/app-form'

export function SectionLayout({
  entry,
  sections,
  sectionId,
}: {
  entry: Entry
  sections: Section[]
  sectionId: number
}) {
  const [formInstance, setFormInstance] = useState<AppFormInstance | null>(null)

  return (
    <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
      <div className="col-span-1">
        <Sidebar
          entry={entry}
          sections={sections}
          sectionId={sectionId}
          form={formInstance}
        />
      </div>
      <div className="col-span-1 md:col-span-2">
        <Form
          entry={entry}
          section={sections.find((s) => s.id === sectionId)!}
          onFormReady={setFormInstance}
        />
      </div>
    </div>
  )
}

