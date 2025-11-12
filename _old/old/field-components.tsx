import { lazy } from 'react'

export const fieldComponents = {
  TextField: lazy(() => import('./text-field')),
  TextareaField: lazy(() => import('./textarea-field')),
}
