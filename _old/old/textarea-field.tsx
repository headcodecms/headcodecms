import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { useFieldContext } from './form-hooks'
import { InputGroupText } from '@/components/ui/input-group'
import { InputGroup, InputGroupTextarea } from '@/components/ui/input-group'
import { InputGroupAddon } from '@/components/ui/input-group'

export default function TextareaField({ label }: { label: string }) {
  const field = useFieldContext<string>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupTextarea
          id={field.name}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          placeholder="I'm having an issue with the login button on mobile."
          rows={6}
          className="min-h-24 resize-none"
          aria-invalid={isInvalid}
        />
        <InputGroupAddon align="block-end">
          <InputGroupText className="tabular-nums">
            {field.state.value.length}/100 characters
          </InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <FieldDescription>
        Include steps to reproduce, expected behavior, and what actually
        happened.
      </FieldDescription>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}
