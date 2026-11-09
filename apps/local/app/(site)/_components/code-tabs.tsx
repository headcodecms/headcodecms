'use client'

import { Check, Copy } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Tabbed code files (`command` renders shell commands) with a copy button.
export const CodeTabs = ({
  tabs,
  command = false,
}: {
  tabs: { value: string; label: string; code: string }[]
  command?: boolean
}) => {
  const [active, setActive] = React.useState(tabs[0]?.value ?? '')
  const [copied, setCopied] = React.useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(
      tabs.find((tab) => tab.value === active)?.code ?? '',
    )
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
          aria-label={command ? 'Copy command' : 'Copy code'}
          onClick={copy}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>
      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className={
            command
              ? 'bg-background rounded-b-xl border p-4'
              : 'bg-background rounded-b-xl border'
          }
        >
          {command ? (
            <pre className="overflow-x-auto font-mono text-sm whitespace-pre-wrap">
              {tab.code}
            </pre>
          ) : (
            <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed">
              <code>{tab.code}</code>
            </pre>
          )}
        </TabsContent>
      ))}
    </Tabs>
  )
}
