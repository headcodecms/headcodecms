'use client'

import { Markdown } from '@tiptap/markdown'
import { type Editor, useCurrentEditor } from '@tiptap/react'
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

type RichtextEditorProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

type EditorCommand = {
  name: string
  icon: LucideIcon
  isActive: (editor: Editor) => boolean
  command: (editor: Editor) => void
}

const textCommands: EditorCommand[] = [
  {
    name: 'Text',
    icon: Text,
    isActive: (editor) => editor.isActive('paragraph'),
    command: (editor) =>
      editor.chain().focus().toggleNode('paragraph', 'paragraph').run(),
  },
  {
    name: 'Heading 1',
    icon: Heading1,
    isActive: (editor) => editor.isActive('heading', { level: 1 }),
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    name: 'Heading 2',
    icon: Heading2,
    isActive: (editor) => editor.isActive('heading', { level: 2 }),
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    name: 'Heading 3',
    icon: Heading3,
    isActive: (editor) => editor.isActive('heading', { level: 3 }),
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    name: 'Bullet List',
    icon: List,
    isActive: (editor) => editor.isActive('bulletList'),
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    name: 'Numbered List',
    icon: ListOrdered,
    isActive: (editor) => editor.isActive('orderedList'),
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    name: 'To-do List',
    icon: CheckSquare,
    isActive: (editor) => editor.isActive('taskItem'),
    command: (editor) =>
      editor.chain().focus().toggleList('taskList', 'taskItem').run(),
  },
  {
    name: 'Quote',
    icon: Quote,
    isActive: (editor) => editor.isActive('blockquote'),
    command: (editor) =>
      editor
        .chain()
        .focus()
        .toggleNode('paragraph', 'paragraph')
        .toggleBlockquote()
        .run(),
  },
  {
    name: 'Code',
    icon: Code,
    isActive: (editor) => editor.isActive('codeBlock'),
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    name: 'Table',
    icon: Table,
    isActive: (editor) => editor.isActive('table'),
    command: (editor) =>
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
]

const formatCommands: EditorCommand[] = [
  {
    name: 'Bold',
    icon: Bold,
    isActive: (editor) => editor.isActive('bold'),
    command: (editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    name: 'Italic',
    icon: Italic,
    isActive: (editor) => editor.isActive('italic'),
    command: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    name: 'Underline',
    icon: Underline,
    isActive: (editor) => editor.isActive('underline'),
    command: (editor) => editor.chain().focus().toggleUnderline().run(),
  },
  {
    name: 'Strikethrough',
    icon: Strikethrough,
    isActive: (editor) => editor.isActive('strike'),
    command: (editor) => editor.chain().focus().toggleStrike().run(),
  },
  {
    name: 'Code',
    icon: Code,
    isActive: (editor) => editor.isActive('code'),
    command: (editor) => editor.chain().focus().toggleCode().run(),
  },
  {
    name: 'Superscript',
    icon: Superscript,
    isActive: (editor) => editor.isActive('superscript'),
    command: (editor) => editor.chain().focus().toggleSuperscript().run(),
  },
  {
    name: 'Subscript',
    icon: Subscript,
    isActive: (editor) => editor.isActive('subscript'),
    command: (editor) => editor.chain().focus().toggleSubscript().run(),
  },
]

const keepEditorSelection = (event: React.MouseEvent) => {
  event.preventDefault()
}

const EditorSelectorButton = ({
  command,
  close,
}: {
  command: EditorCommand
  close: () => void
}) => {
  const { editor } = useCurrentEditor()

  if (!editor) return null

  const Icon = command.icon
  const active = command.isActive(editor)

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 w-full justify-start rounded-2xl px-3"
      onMouseDown={keepEditorSelection}
      onClick={() => {
        command.command(editor)
        close()
      }}
    >
      <Icon data-icon="inline-start" className="text-muted-foreground" />
      <span className="flex-1 text-left">{command.name}</span>
      {active ? <Check data-icon="inline-end" /> : null}
    </Button>
  )
}

const EditorMenuIconButton = ({ command }: { command: EditorCommand }) => {
  const { editor } = useCurrentEditor()

  if (!editor) return null

  const Icon = command.icon

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={command.name}
      onMouseDown={keepEditorSelection}
      onClick={() => command.command(editor)}
    >
      <Icon />
    </Button>
  )
}

const EditorSelector = ({
  title,
  commands,
}: {
  title: string
  commands: EditorCommand[]
}) => {
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
        <span className="whitespace-nowrap text-xs">{title}</span>
        <ChevronDown />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={5}
        className="w-52 gap-1 rounded-2xl p-1"
      >
        {commands.map((command) => (
          <EditorSelectorButton
            key={command.name}
            command={command}
            close={() => setOpen(false)}
          />
        ))}
      </PopoverContent>
    </Popover>
  )
}

const ClearFormattingButton = () => (
  <EditorMenuIconButton
    command={{
      name: 'Clear Formatting',
      icon: RemoveFormatting,
      isActive: () => false,
      command: (editor) =>
        editor.chain().focus().clearNodes().unsetAllMarks().run(),
    }}
  />
)

const getLinkUrl = (value: string) => {
  const trimmed = value.trim()

  if (!trimmed) return null

  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
  ) {
    return trimmed
  }

  try {
    return new URL(trimmed).toString()
  } catch {
    if (trimmed.includes('.') && !trimmed.includes(' ')) {
      return new URL(`https://${trimmed}`).toString()
    }
  }

  return null
}

const EditorLinkSelector = () => {
  const { editor } = useCurrentEditor()
  const [open, setOpen] = React.useState(false)
  const [url, setUrl] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!open || !editor) return

    window.requestAnimationFrame(() => {
      setUrl((editor.getAttributes('link') as { href?: string }).href ?? '')
      inputRef.current?.focus()
    })
  }, [editor, open])

  if (!editor) return null

  const linked = editor.isActive('link')

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'rounded-none border-none',
              linked && 'text-primary underline underline-offset-4'
            )}
            onMouseDown={keepEditorSelection}
          />
        }
      >
        <ExternalLink data-icon="inline-start" />
        <span className="text-xs">Link</span>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={10} className="w-72 gap-0 p-1">
        <form
          className="flex items-center gap-1"
          onSubmit={(event) => {
            event.preventDefault()

            const href = getLinkUrl(url)
            if (!href) return

            editor.chain().focus().setLink({ href }).run()
            setOpen(false)
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
                setOpen(false)
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

export const AdminRichtextEditor = ({
  value,
  onChange,
  placeholder = 'Write content...',
}: RichtextEditorProps) => (
  <EditorProvider
    className="headcode-richtext-editor"
    content={value}
    contentType="markdown"
    extensions={[
      Markdown.configure({
        markedOptions: {
          gfm: true,
          breaks: false,
        },
      }),
    ]}
    onUpdate={({ editor }) => {
      onChange(editor.getMarkdown())
    }}
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
