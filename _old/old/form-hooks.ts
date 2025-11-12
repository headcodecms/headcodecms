import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import { fieldComponents } from './field-components'
export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts()

export const { useAppForm } = createFormHook({
  fieldComponents,
  formComponents: {},
  fieldContext,
  formContext,
})
