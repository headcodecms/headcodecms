import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useFieldContext } from './app-form'
import type { LinkValue } from './link-field'

export default function LinkFieldComponent({
  label,
  description,
}: {
  label: string
  description?: string | undefined
}) {
  const field = useFieldContext<LinkValue>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const value = field.state.value || {
    title: '',
    url: '',
    openInNewWindow: false,
  }

  const handleTitleChange = (title: string) => {
    field.handleChange({
      ...value,
      title,
    })
  }

  const handleUrlChange = (url: string) => {
    field.handleChange({
      ...value,
      url,
    })
  }

  const handleOpenInNewWindowChange = (openInNewWindow: boolean) => {
    field.handleChange({
      ...value,
      openInNewWindow,
    })
  }

  return (
    <Field data-invalid={isInvalid}>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:gap-4">
          <div className="flex-1">
            <FieldLabel htmlFor={`${field.name}-title`} className="text-sm">
              {label}
            </FieldLabel>
            <Input
              id={`${field.name}-title`}
              name={`${field.name}.title`}
              value={value.title}
              onBlur={field.handleBlur}
              onChange={(e) => handleTitleChange(e.target.value)}
              aria-invalid={isInvalid}
              autoComplete="off"
              className="mt-1"
            />
          </div>
          <div className="flex-1">
            <FieldLabel htmlFor={`${field.name}-url`} className="text-sm">
              URL
            </FieldLabel>
            <Input
              id={`${field.name}-url`}
              name={`${field.name}.url`}
              value={value.url}
              onBlur={field.handleBlur}
              onChange={(e) => handleUrlChange(e.target.value)}
              aria-invalid={isInvalid}
              autoComplete="off"
              className="mt-1"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${field.name}-openInNewWindow`}
            name={`${field.name}.openInNewWindow`}
            checked={value.openInNewWindow}
            onCheckedChange={(checked) =>
              handleOpenInNewWindowChange(checked === true)
            }
            onBlur={field.handleBlur}
            aria-invalid={isInvalid}
          />
          <FieldLabel
            htmlFor={`${field.name}-openInNewWindow`}
            className="cursor-pointer text-sm font-normal"
          >
            Open in new window
          </FieldLabel>
        </div>
      </div>
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  )
}
