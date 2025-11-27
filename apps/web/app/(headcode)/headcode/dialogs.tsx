'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import type { UIEntryType } from '@/lib/headcode/types'
import { useForm } from '@tanstack/react-form'
import { AlertCircleIcon, FileStackIcon } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import { addEntry } from './actions'
import { useRouter } from 'next/navigation'

const formSchema = z.object({
  namespace: z.string(),
  key: z
    .string()
    .regex(
      /^[a-zA-Z0-9-_]+$/,
      'Key can only contain letters, numbers, dashes, and underscores',
    ),
})

export function DialogAddEntry({
  version,
  dynamicEntries,
}: {
  version: string
  dynamicEntries: UIEntryType[]
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [redirectPath, setRedirectPath] = useState<string | null>(null)
  const router = useRouter()

  const form = useForm({
    defaultValues: {
      namespace: dynamicEntries[0].namespace,
      key: '',
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null)

      const { entry: newEntry, error } = await addEntry({
        version,
        namespace: value.namespace,
        key: value.key,
      })

      if (newEntry) {
        form.reset()
        setRedirectPath(`/headcode/section/${newEntry.id}`)
        setOpen(false)
      } else if (error) {
        setError(error)
      }
    },
  })

  const handleAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (
      !open &&
      redirectPath &&
      target.getAttribute('data-state') === 'closed'
    ) {
      router.push(redirectPath)
      setRedirectPath(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <FileStackIcon className="size-4" />
          Add <span className="hidden sm:inline">dynamic entry</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]"
        onAnimationEnd={handleAnimationEnd}
      >
        <DialogHeader>
          <DialogTitle>Add entry</DialogTitle>
          <DialogDescription>
            Add a new dynamic entry to Headcode CMS.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Error adding entry.</AlertTitle>
            <AlertDescription>
              <p>{error}</p>
            </AlertDescription>
          </Alert>
        )}
        <form
          id="add-entry-form"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field name="namespace">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Namespace</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      aria-invalid={isInvalid}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select namespace" />
                      </SelectTrigger>
                      <SelectContent>
                        {dynamicEntries.map((entryType) => (
                          <SelectItem
                            key={entryType.namespace}
                            value={entryType.namespace}
                          >
                            {entryType.namespace}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="key">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Key</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      autoComplete="off"
                    />
                    <FieldDescription>
                      Use letters, numbers, dashes, and underscores for the key.
                    </FieldDescription>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            </form.Field>
          </FieldGroup>
        </form>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>

              <Button type="submit" form="add-entry-form" disabled={!canSubmit}>
                {isSubmitting && <Spinner />}
                Add Entry
              </Button>
            </DialogFooter>
          )}
        </form.Subscribe>
      </DialogContent>
    </Dialog>
  )
}
