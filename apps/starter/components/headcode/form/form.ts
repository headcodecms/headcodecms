import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import CheckboxFieldComponent from './checkbox-field-component'
import DatePickerFieldComponent from './date-picker-field-component'
import LinkFieldComponent from './link-field-component'
import RadioGroupFieldComponent from './radio-group-field-component'
import SelectFieldComponent from './select-field-component'
import SwitchFieldComponent from './switch-field-component'
import TextFieldComponent from './text-field-component'
import TextareaFieldComponent from './textarea-field-component'
import EditorFieldComponent from './editor-field-component'

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts()

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextFieldComponent,
    TextareaFieldComponent,
    CheckboxFieldComponent,
    RadioGroupFieldComponent,
    SelectFieldComponent,
    DatePickerFieldComponent,
    SwitchFieldComponent,
    LinkFieldComponent,
    EditorFieldComponent,
  },
  formComponents: {},
  fieldContext,
  formContext,
})
