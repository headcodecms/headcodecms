'use client'

import { Check, Copy } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type InstallTab = {
  value: string
  label: string
  command: string
}

export const InstallSnippet = ({ tabs }: { tabs: InstallTab[] }) => {
  const [active, setActive] = React.useState(tabs[0]?.value ?? '')
  const [copied, setCopied] = React.useState(false)
  const activeCommand = tabs.find((tab) => tab.value === active)?.command ?? ''

  const copyCommand = async () => {
    await navigator.clipboard.writeText(activeCommand)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <Tabs value={active} onValueChange={setActive}>
      <div className="bg-muted flex items-center justify-between gap-3 rounded-t-xl border border-b-0 p-2">
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Copy command"
          onClick={copyCommand}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>
      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className="bg-background rounded-b-xl border p-4"
        >
          <pre className="overflow-x-auto font-mono text-sm whitespace-pre-wrap">
            {tab.command}
          </pre>
        </TabsContent>
      ))}
    </Tabs>
  )
}
