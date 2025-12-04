'use client'

import type { JSONContent } from '@/components/headcode/editor'
import {
  EditorBubbleMenu,
  EditorClearFormatting,
  EditorFloatingMenu,
  EditorFormatBold,
  EditorFormatCode,
  EditorFormatItalic,
  EditorFormatStrike,
  EditorFormatSubscript,
  EditorFormatSuperscript,
  EditorFormatUnderline,
  EditorLinkSelector,
  EditorNodeBulletList,
  EditorNodeCode,
  EditorNodeHeading1,
  EditorNodeHeading2,
  EditorNodeHeading3,
  EditorNodeOrderedList,
  EditorNodeQuote,
  EditorNodeTaskList,
  EditorNodeText,
  EditorProvider,
  EditorSelector,
} from '@/components/headcode/editor'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { useFieldContext } from './app-form'

export default function EditorFieldComponent({
  label,
  description,
}: {
  label: string
  description?: string | undefined
}) {
  const field = useFieldContext<JSONContent | null>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const content = field.state.value

  const handleUpdate = (newContent: JSONContent) => {
    field.handleChange(newContent)
  }

  return (
    <Field data-invalid={isInvalid}>
      <FieldContent>
        <FieldLabel>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </FieldContent>
      <div className="relative" onBlur={field.handleBlur}>
        <EditorProvider
          content={content || undefined}
          placeholder="Start typing..."
          className="typography bg-background h-full max-h-[600px] min-h-[200px] w-full overflow-y-auto rounded-lg border p-4"
          onUpdate={({ editor }) => {
            const newContent = editor.getJSON()
            handleUpdate(newContent)
          }}
        >
          <EditorFloatingMenu>
            <EditorNodeHeading1 hideName />
            <EditorNodeBulletList hideName />
            <EditorNodeQuote hideName />
            <EditorNodeCode hideName />
          </EditorFloatingMenu>
          <EditorBubbleMenu>
            <EditorSelector title="Text">
              <EditorNodeText />
              <EditorNodeHeading1 />
              <EditorNodeHeading2 />
              <EditorNodeHeading3 />
              <EditorNodeBulletList />
              <EditorNodeOrderedList />
              <EditorNodeTaskList />
              <EditorNodeQuote />
              <EditorNodeCode />
            </EditorSelector>
            <EditorSelector title="Format">
              <EditorFormatBold />
              <EditorFormatItalic />
              <EditorFormatUnderline />
              <EditorFormatStrike />
              <EditorFormatCode />
              <EditorFormatSuperscript />
              <EditorFormatSubscript />
            </EditorSelector>
            <EditorLinkSelector />
            <EditorClearFormatting />
          </EditorBubbleMenu>
        </EditorProvider>
      </div>
    </Field>
  )
}
