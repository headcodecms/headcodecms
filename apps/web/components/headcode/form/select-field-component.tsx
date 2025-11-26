import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFieldContext } from './app-form'

export default function SelectFieldComponent({
  label,
  description,
  options = [],
}: {
  label: string
  description?: string | undefined
  options?: { label: string; value: string }[]
}) {
  const field = useFieldContext<string>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  return (
    <Field data-invalid={isInvalid}>
      <FieldContent>
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </FieldContent>
      <Select
        name={field.name}
        value={field.state.value}
        onValueChange={field.handleChange}
      >
        <SelectTrigger
          id="form-tanstack-select-language"
          aria-invalid={isInvalid}
          className="min-w-[120px]"
        >
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent position="item-aligned">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}
