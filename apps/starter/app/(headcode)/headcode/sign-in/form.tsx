'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import { useForm } from '@tanstack/react-form'
import { useRouter } from 'next/navigation'
import { z } from 'zod'

// share with sign up
const formSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export function SignInForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const router = useRouter()
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      console.log('submitting form', value)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const { data, error } = await authClient.signUp.email({
        email: 'test@test.com',
        password: 'test',
        name: 'Test User',
      })

      if (error) {
        console.log('error signing in', error)
      }

      if (data) {
        console.log('signed in data', data)
        router.push('/headcode')
      }
    },
  })

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <h2 className="text-center text-3xl font-bold tracking-tight">
        Headcode CMS
      </h2>
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Sign in to your account to continue. If you don&apos;t have an
            account, please contact your administrator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="sign-in-form"
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
                        placeholder="name@example.com"
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
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              </form.Field>
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
              >
                {([canSubmit, isSubmitting]) => (
                  <Field>
                    <Button
                      type="submit"
                      form="sign-in-form"
                      disabled={!canSubmit}
                    >
                      {isSubmitting && <Spinner />}
                      Sign in
                    </Button>
                  </Field>
                )}
              </form.Subscribe>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
