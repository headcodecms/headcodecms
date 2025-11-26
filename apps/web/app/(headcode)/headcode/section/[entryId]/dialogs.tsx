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
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import type { Entry } from '@/lib/headcode/types'
import type { SectionName } from '@/lib/headcode/types'
import { useForm } from '@tanstack/react-form'
import { AlertCircleIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import { addSection } from './actions'
import { useRouter } from 'next/navigation'

const formSchema = z.object({
  section: z.string(),
})

export function DialogAddSection({
  entry,
  sectionNames,
  size = 'default',
}: {
  entry: Entry
  sectionNames: SectionName[]
  size?: 'default' | 'sm'
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [redirectPath, setRedirectPath] = useState<string | null>(null)
  const router = useRouter()

  const form = useForm({
    defaultValues: {
      section: sectionNames[0].name,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null)

      const { section, error } = await addSection({
        name: value.section,
        pos: 0,
        pinned: false,
        data: null,
        entryId: entry.id,
      })

      if (section) {
        form.reset()
        setRedirectPath(`/headcode/section/${entry.id}/${section.id}`)
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
        <Button
          variant="secondary"
          size={size}
          className={size === 'default' ? 'w-full' : 'w-auto'}
        >
          <PlusIcon className="size-4" />
          Add section
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]"
        onAnimationEnd={handleAnimationEnd}
      >
        <DialogHeader>
          <DialogTitle>Add section</DialogTitle>
          <DialogDescription>
            Add a new section to {entry.namespace} / {entry.key}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Error adding section.</AlertTitle>
            <AlertDescription>
              <p>{error}</p>
            </AlertDescription>
          </Alert>
        )}
        <form
          id="add-section-form"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field name="section">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Section</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      aria-invalid={isInvalid}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectionNames.map((s, index) => (
                          <SelectItem key={index} value={s.name}>
                            {s.label}
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

              <Button
                type="submit"
                form="add-section-form"
                disabled={!canSubmit}
              >
                {isSubmitting && <Spinner />}
                Add Section
              </Button>
            </DialogFooter>
          )}
        </form.Subscribe>
      </DialogContent>
    </Dialog>
  )
}
