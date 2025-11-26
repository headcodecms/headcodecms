import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { useFieldContext } from './app-form'

export default function SwitchFieldComponent({
  label,
  description,
}: {
  label: string
  description?: string | undefined
}) {
  const field = useFieldContext<boolean>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  return (
    <Field data-invalid={isInvalid}>
      <div className="flex items-center gap-2">
        <Switch
          id={field.name}
          name={field.name}
          checked={field.state.value}
          onCheckedChange={(checked) => field.handleChange(checked === true)}
          onBlur={field.handleBlur}
          aria-invalid={isInvalid}
        />
        <FieldLabel htmlFor={field.name} className="cursor-pointer">
          {label}
        </FieldLabel>
      </div>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
