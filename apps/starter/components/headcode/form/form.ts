import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import TextFieldComponent from './text-field-component'
import TextareaFieldComponent from './textarea-field-component'

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts()

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextFieldComponent,
    TextareaFieldComponent,
  },
  formComponents: {},
  fieldContext,
  formContext,
})
