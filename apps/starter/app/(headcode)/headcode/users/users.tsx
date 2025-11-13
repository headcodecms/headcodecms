'use client'

import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { UserRoundPlusIcon } from 'lucide-react'
import { useState } from 'react'
import { DialogAddUser } from './dialogs'
import { UsersTable } from './table'

export function Users({ noUsers }: { noUsers: boolean }) {
  const [update, setUpdate] = useState(true)

  return (
    <>
      <div className="flex items-end justify-between gap-12">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground max-w-3xl text-sm">
            Manage users for Headcode CMS.
          </p>
        </div>
        <div>
          <DialogAddUser noUsers={noUsers} setUpdate={setUpdate} />
        </div>
      </div>

      <Separator className="mt-6" />

      <div className="my-6">
        {noUsers ? (
          <Empty className="bg-card">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UserRoundPlusIcon />
              </EmptyMedia>
              <EmptyTitle>
                Add yourself as an admin user to get started
              </EmptyTitle>
            </EmptyHeader>
            <EmptyContent>
              <DialogAddUser noUsers={noUsers} setUpdate={setUpdate} />
            </EmptyContent>
          </Empty>
        ) : (
          <UsersTable update={update} setUpdate={setUpdate} />
        )}
      </div>
    </>
  )
}
