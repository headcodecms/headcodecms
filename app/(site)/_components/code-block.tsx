'use client'

import { Check, Copy } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type CodeFile = {
  value: string
  filename: string
  code: string
  language?: string
}

export const FileCodeBlock = ({
  files,
  defaultValue,
}: {
  files: CodeFile[]
  defaultValue?: string
}) => {
  const [active, setActive] = React.useState(defaultValue ?? files[0]?.value ?? '')
  const [copied, setCopied] = React.useState(false)
  const activeFile = files.find((file) => file.value === active)

  const copyCode = async () => {
    await navigator.clipboard.writeText(activeFile?.code ?? '')
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <Tabs value={active} onValueChange={setActive}>
      <div className="bg-muted flex items-center justify-between gap-3 rounded-t-xl border border-b-0 p-2">
        <TabsList>
          {files.map((file) => (
            <TabsTrigger key={file.value} value={file.value}>
              {file.filename}
            </TabsTrigger>
          ))}
        </TabsList>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Copy code"
          onClick={copyCode}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>
      {files.map((file) => (
        <TabsContent
          key={file.value}
          value={file.value}
          className="bg-background rounded-b-xl border"
        >
          <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed">
            <code>{file.code}</code>
          </pre>
        </TabsContent>
      ))}
    </Tabs>
  )
}
