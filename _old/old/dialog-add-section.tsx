'use client'

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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm } from '@tanstack/react-form'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import { addSection } from './actions'
import { Spinner } from '@/components/ui/spinner'
import { headcodeConfig } from '@/headcode.config'
import { Entry } from './entry'

const formSchema = z.object({
  type: z.string(),
  title: z.string().min(1, 'Title is required'),
})

export function DialogAddSection({ entry }: { entry: Entry }) {
  const sections = Array.from(
    new Map(
      (
        headcodeConfig.entries.find(
          (e) => e.namespace === entry.namespace && e.key === entry.key,
        )?.sections ?? []
      ).map((s) => [s.section.name, s] as const),
    ).values(),
  )
  const [open, setOpen] = useState(false)
  const form = useForm({
    defaultValues: {
      type: sections[0].section.name,
      title: '',
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      console.log('submitting form', value)
      const result = await addSection(value)
      console.log('section added successfully', result)
      form.reset()
      setOpen(false)
    },
  })

  if (!sections || sections.length === 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="default" className="w-full">
          <PlusIcon className="size-4" />
          Add section
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add section</DialogTitle>
          <DialogDescription>
            Add a new section to Headcode CMS.
          </DialogDescription>
        </DialogHeader>
        <form
          id="add-section-form"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field name="type">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Role</FieldLabel>
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
                        {sections.map((s, index) => (
                          <SelectItem key={index} value={s.section.name}>
                            {s.section.title}
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
            <form.Field name="title">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Section title"
                      autoComplete="off"
                    />
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
