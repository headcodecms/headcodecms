'use client'

import {
  Snippet,
  SnippetCopyButton,
  SnippetHeader,
  SnippetTabsContent,
  SnippetTabsList,
  SnippetTabsTrigger,
} from '@/components/kibo-ui/snippet'
import { useState } from 'react'

export default function Commands({
  snippets,
}: {
  snippets: { title: string; code: string }[]
}) {
  const [value, setValue] = useState(snippets[0].title)
  const activeCommand = snippets.find((item) => item.title === value)

  return (
    <Snippet onValueChange={setValue} value={value}>
      <SnippetHeader>
        <SnippetTabsList>
          {snippets.map((command) => (
            <SnippetTabsTrigger key={command.title} value={command.title}>
              <span>{command.title}</span>
            </SnippetTabsTrigger>
          ))}
        </SnippetTabsList>
        {activeCommand && (
          <SnippetCopyButton
            onCopy={() =>
              console.log(`Copied "${activeCommand.code}" to clipboard`)
            }
            onError={() =>
              console.error(
                `Failed to copy "${activeCommand.code}" to clipboard`,
              )
            }
            value={activeCommand.code}
          />
        )}
      </SnippetHeader>
      {snippets.map((command) => (
        <SnippetTabsContent
          className="whitespace-pre-wrap"
          key={command.title}
          value={command.title}
        >
          {command.code}
        </SnippetTabsContent>
      ))}
    </Snippet>
  )
}
