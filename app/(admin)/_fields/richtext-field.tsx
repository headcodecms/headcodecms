'use client'

import { AdminRichtextEditor } from '../_components/richtext-editor'

type RichtextFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export const RichtextField = ({
  value,
  onChange,
  placeholder = 'Write content...',
}: RichtextFieldProps) => (
  <AdminRichtextEditor
    value={value}
    onChange={onChange}
    placeholder={placeholder}
  />
)
