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
import type { Role } from '@/lib/headcode/types'
import { authClient } from '@/lib/auth-client'
import { useForm } from '@tanstack/react-form'
import { User } from 'better-auth'
import { AlertCircleIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import { addUser } from './actions'

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')

const formSchema = z.object({
  email: z.email('Invalid email address'),
  password: passwordSchema,
  role: z.enum(['admin', 'user']),
})

export function DialogAddUser({
  noUsers,
  setUpdate,
}: {
  noUsers: boolean
  setUpdate: (update: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      role: 'admin',
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      setError(null)

      const { success, error } = await addUser({
        email: value.email,
        password: value.password,
        role: value.role as Role,
      })

      if (success) {
        if (noUsers) {
          const { error } = await authClient.signIn.email({
            email: value.email,
            password: value.password,
            callbackURL: '/headcode',
          })

          if (error) {
            setIsSubmitting(false)
            setError(
              error.message ??
                'An error occurred while signing in. Please try again.',
            )
          }
        } else {
          form.reset()
          setIsSubmitting(false)
          setOpen(false)
          setUpdate(true)
        }
      } else if (error) {
        setError(error)
        setIsSubmitting(false)
      }
    },
  })

  const title = noUsers ? 'Add admin user' : 'Add user'
  const description = noUsers
    ? 'Add yourself as an admin user to get started'
    : 'Add a new user to Headcode CMS.'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <PlusIcon className="size-4" />
          {title}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Error adding user.</AlertTitle>
            <AlertDescription>
              <p>{error}</p>
            </AlertDescription>
          </Alert>
        )}
        <form
          id="add-user-form"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field name="email">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="john@example.com"
                      autoComplete="off"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="password">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>
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
                      Password must be at least 8 characters.
                    </FieldDescription>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            </form.Field>
            <form.Field name="role">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Role</FieldLabel>
                    <Select
                      disabled={noUsers}
                      name={field.name}
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      aria-invalid={isInvalid}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="user">User</SelectItem>
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
        <form.Subscribe selector={(state) => [state.canSubmit]}>
          {([canSubmit]) => (
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>

              <Button type="submit" form="add-user-form" disabled={!canSubmit}>
                {isSubmitting && <Spinner />}
                Add User
              </Button>
            </DialogFooter>
          )}
        </form.Subscribe>
      </DialogContent>
    </Dialog>
  )
}

export function DialogChangePassword({
  user,
  open,
  setOpen,
}: {
  user: User | null
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const [error, setError] = useState<boolean>(false)

  const form = useForm({
    defaultValues: {
      password: '',
    },
    validators: {
      onSubmit: z.object({
        password: passwordSchema,
      }),
    },
    onSubmit: async ({ value }) => {
      if (!user) return
      setError(false)

      const { error } = await authClient.admin.setUserPassword({
        newPassword: value.password,
        userId: user.id,
      })

      if (error) {
        setError(true)
      } else {
        form.reset()
        setOpen(false)
      }
    },
  })

  if (!user) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Change the password for {user.email}.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>Error changing password.</AlertTitle>
            <AlertDescription>
              <p>
                An error occurred while changing the password. Please try again.
              </p>
            </AlertDescription>
          </Alert>
        )}
        <form
          id="change-password-form"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            <form.Field name="password">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>
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
                      Password must be at least 8 characters.
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

              <Button
                type="submit"
                form="change-password-form"
                disabled={!canSubmit}
              >
                {isSubmitting && <Spinner />}
                Change Password
              </Button>
            </DialogFooter>
          )}
        </form.Subscribe>
      </DialogContent>
    </Dialog>
  )
}
