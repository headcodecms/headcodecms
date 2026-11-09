'use client'

import { Markdown } from '@tiptap/markdown'
import {
  type ChainedCommands,
  type Editor,
  useCurrentEditor,
} from '@tiptap/react'
import {
  Bold,
  Check,
  CheckSquare,
  ChevronDown,
  Code,
  ExternalLink,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  type LucideIcon,
  Quote,
  RemoveFormatting,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  Text,
  Trash,
  Underline,
} from 'lucide-react'
import * as React from 'react'

import {
  EditorBubbleMenu,
  EditorFloatingMenu,
  EditorProvider,
  EditorTableColumnAfter,
  EditorTableColumnBefore,
  EditorTableColumnDelete,
  EditorTableColumnMenu,
  EditorTableDelete,
  EditorTableFix,
  EditorTableGlobalMenu,
  EditorTableHeaderColumnToggle,
  EditorTableHeaderRowToggle,
  EditorTableMenu,
  EditorTableMergeCells,
  EditorTableRowAfter,
  EditorTableRowBefore,
  EditorTableRowDelete,
  EditorTableRowMenu,
  EditorTableSplitCell,
} from '@/components/kibo-ui/editor'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type EditorCommand = {
  name: string
  icon: LucideIcon
  active: [name: string, attributes?: Record<string, unknown>]
  run: (chain: ChainedCommands) => ChainedCommands
}

const textCommands: EditorCommand[] = [
  {
    name: 'Text',
    icon: Text,
    active: ['paragraph'],
    run: (c) => c.toggleNode('paragraph', 'paragraph'),
  },
  {
    name: 'Heading 1',
    icon: Heading1,
    active: ['heading', { level: 1 }],
    run: (c) => c.toggleHeading({ level: 1 }),
  },
  {
    name: 'Heading 2',
    icon: Heading2,
    active: ['heading', { level: 2 }],
    run: (c) => c.toggleHeading({ level: 2 }),
  },
  {
    name: 'Heading 3',
    icon: Heading3,
    active: ['heading', { level: 3 }],
    run: (c) => c.toggleHeading({ level: 3 }),
  },
  {
    name: 'Bullet List',
    icon: List,
    active: ['bulletList'],
    run: (c) => c.toggleBulletList(),
  },
  {
    name: 'Numbered List',
    icon: ListOrdered,
    active: ['orderedList'],
    run: (c) => c.toggleOrderedList(),
  },
  {
    name: 'To-do List',
    icon: CheckSquare,
    active: ['taskItem'],
    run: (c) => c.toggleList('taskList', 'taskItem'),
  },
  {
    name: 'Quote',
    icon: Quote,
    active: ['blockquote'],
    run: (c) => c.toggleNode('paragraph', 'paragraph').toggleBlockquote(),
  },
  {
    name: 'Code',
    icon: Code,
    active: ['codeBlock'],
    run: (c) => c.toggleCodeBlock(),
  },
  {
    name: 'Table',
    icon: Table,
    active: ['table'],
    run: (c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
  },
]

const formatCommands: EditorCommand[] = [
  { name: 'Bold', icon: Bold, active: ['bold'], run: (c) => c.toggleBold() },
  {
    name: 'Italic',
    icon: Italic,
    active: ['italic'],
    run: (c) => c.toggleItalic(),
  },
  {
    name: 'Underline',
    icon: Underline,
    active: ['underline'],
    run: (c) => c.toggleUnderline(),
  },
  {
    name: 'Strikethrough',
    icon: Strikethrough,
    active: ['strike'],
    run: (c) => c.toggleStrike(),
  },
  { name: 'Code', icon: Code, active: ['code'], run: (c) => c.toggleCode() },
  {
    name: 'Superscript',
    icon: Superscript,
    active: ['superscript'],
    run: (c) => c.toggleSuperscript(),
  },
  {
    name: 'Subscript',
    icon: Subscript,
    active: ['subscript'],
    run: (c) => c.toggleSubscript(),
  },
]

// Menus only render inside EditorProvider, which renders nothing until the editor exists.
const useEditor = () => useCurrentEditor().editor as Editor

const keepEditorSelection = (event: React.MouseEvent) => event.preventDefault()

const EditorSelector = ({
  title,
  commands,
}: {
  title: string
  commands: EditorCommand[]
}) => {
  const editor = useEditor()
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-none border-none"
            onMouseDown={keepEditorSelection}
          />
        }
      >
        <span className="text-xs whitespace-nowrap">{title}</span>
        <ChevronDown />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={5}
        className="w-52 gap-1 rounded-2xl p-1"
      >
        {commands.map(({ name, icon: Icon, active, run }) => (
          <Button
            key={name}
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-start rounded-2xl px-3"
            onMouseDown={keepEditorSelection}
            onClick={() => {
              run(editor.chain().focus()).run()
              setOpen(false)
            }}
          >
            <Icon data-icon="inline-start" className="text-muted-foreground" />
            <span className="flex-1 text-left">{name}</span>
            {editor.isActive(active[0], active[1]) ? (
              <Check data-icon="inline-end" />
            ) : null}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

const getLinkUrl = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^([/#]|[a-z][a-z0-9+.-]*:)/i.test(trimmed)) return trimmed
  try {
    return new URL(trimmed).toString()
  } catch {
    return trimmed.includes('.') && !trimmed.includes(' ')
      ? new URL(`https://${trimmed}`).toString()
      : null
  }
}

const EditorLinkSelector = () => {
  const editor = useEditor()
  const [open, setOpen] = React.useState(false)
  const [url, setUrl] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)
  const linked = editor.isActive('link')

  const close = () => setOpen(false)

  return (
    <Popover
      modal
      open={open}
      onOpenChange={(next) => {
        if (next) setUrl(editor.getAttributes('link').href ?? '')
        setOpen(next)
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'rounded-none border-none',
              linked && 'text-primary underline underline-offset-4',
            )}
            onMouseDown={keepEditorSelection}
          />
        }
      >
        <ExternalLink data-icon="inline-start" />
        <span className="text-xs">Link</span>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={10}
        initialFocus={inputRef}
        className="w-72 gap-0 p-1"
      >
        <form
          className="flex items-center gap-1"
          onSubmit={(event) => {
            event.preventDefault()
            const href = getLinkUrl(url)
            if (!href) return
            editor.chain().focus().setLink({ href }).run()
            close()
          }}
        >
          <input
            ref={inputRef}
            aria-label="Link URL"
            value={url}
            type="text"
            placeholder="Paste a link or path"
            className="min-w-0 flex-1 rounded-xl bg-transparent px-2 py-1.5 text-sm outline-none"
            onChange={(event) => setUrl(event.target.value)}
          />
          {linked ? (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Remove link"
              onClick={() => {
                editor.chain().focus().unsetLink().run()
                close()
              }}
            >
              <Trash />
            </Button>
          ) : (
            <Button type="submit" size="icon-sm" variant="secondary">
              <Check />
            </Button>
          )}
        </form>
      </PopoverContent>
    </Popover>
  )
}

const ClearFormattingButton = () => {
  const editor = useEditor()
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Clear Formatting"
      onMouseDown={keepEditorSelection}
      onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
    >
      <RemoveFormatting />
    </Button>
  )
}

export const AdminRichtextEditor = ({
  value,
  onChange,
  placeholder = 'Write content...',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) => (
  <EditorProvider
    className="headcode-richtext-editor"
    content={value}
    contentType="markdown"
    extensions={[
      Markdown.configure({ markedOptions: { gfm: true, breaks: false } }),
    ]}
    onUpdate={({ editor }) => onChange(editor.getMarkdown())}
    placeholder={placeholder}
  >
    <EditorFloatingMenu />
    <EditorBubbleMenu>
      <EditorSelector title="Text" commands={textCommands} />
      <EditorSelector title="Format" commands={formatCommands} />
      <EditorLinkSelector />
      <ClearFormattingButton />
    </EditorBubbleMenu>
    <EditorTableMenu>
      <EditorTableColumnMenu>
        <EditorTableColumnBefore />
        <EditorTableColumnAfter />
        <EditorTableColumnDelete />
      </EditorTableColumnMenu>
      <EditorTableRowMenu>
        <EditorTableRowBefore />
        <EditorTableRowAfter />
        <EditorTableRowDelete />
      </EditorTableRowMenu>
      <EditorTableGlobalMenu>
        <EditorTableHeaderColumnToggle />
        <EditorTableHeaderRowToggle />
        <EditorTableMergeCells />
        <EditorTableSplitCell />
        <EditorTableFix />
        <EditorTableDelete />
      </EditorTableGlobalMenu>
    </EditorTableMenu>
  </EditorProvider>
)
