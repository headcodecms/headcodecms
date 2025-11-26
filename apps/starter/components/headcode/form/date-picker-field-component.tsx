'use client'

import { useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useFieldContext } from './app-form'
import { format } from 'date-fns'

export default function DatePickerFieldComponent({
  label,
  description,
  options,
}: {
  label: string
  description?: string | undefined
  options?: { time?: boolean }
}) {
  const field = useFieldContext<Date | null>()
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const enableTime = options?.time ?? false
  const [open, setOpen] = useState(false)

  // Derive selectedDate directly from field value
  const selectedDate = field.state.value || undefined

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      field.handleChange(null)
      setOpen(false)
      return
    }

    const newDate = new Date(date)

    if (enableTime && field.state.value) {
      // Preserve the time from the current field value
      newDate.setHours(field.state.value.getHours())
      newDate.setMinutes(field.state.value.getMinutes())
      newDate.setSeconds(field.state.value.getSeconds())
    } else if (enableTime) {
      // When time is enabled but no date was selected before, set default time to 00:00
      newDate.setHours(0, 0, 0, 0)
    } else {
      // For date-only, set time to start of day
      newDate.setHours(0, 0, 0, 0)
    }

    field.handleChange(newDate)
    setOpen(false)
  }

  const handleTimeChange = (timeString: string) => {
    if (!selectedDate) return

    const [hours, minutes] = timeString.split(':')
    const newDate = new Date(selectedDate)
    newDate.setHours(parseInt(hours, 10))
    newDate.setMinutes(parseInt(minutes, 10))
    newDate.setSeconds(0)

    field.handleChange(newDate)
  }

  const formatTimeValue = (date: Date): string => {
    return format(date, 'HH:mm')
  }

  return (
    <Field data-invalid={isInvalid}>
      <FieldContent>
        <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
        {isInvalid && <FieldError errors={field.state.meta.errors} />}
      </FieldContent>
      <div className={enableTime ? 'flex gap-4' : 'flex flex-col gap-3'}>
        <div className="flex flex-col gap-3">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                id={field.name}
                className="w-full justify-between font-normal"
                aria-invalid={isInvalid}
              >
                {selectedDate
                  ? selectedDate.toLocaleDateString()
                  : 'Select date'}
                <ChevronDownIcon className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="start"
            >
              <Calendar
                mode="single"
                selected={selectedDate}
                captionLayout="dropdown"
                onSelect={handleDateSelect}
              />
            </PopoverContent>
          </Popover>
        </div>
        {enableTime && selectedDate && (
          <div className="flex flex-col gap-3">
            <FieldLabel htmlFor={`${field.name}-time`}>Time</FieldLabel>
            <Input
              id={`${field.name}-time`}
              type="time"
              step="1"
              value={formatTimeValue(selectedDate)}
              onChange={(e) => handleTimeChange(e.target.value)}
              onBlur={field.handleBlur}
              aria-invalid={isInvalid}
              className="w-full"
            />
          </div>
        )}
      </div>
    </Field>
  )
}
