'use client'

import { ConfirmationDialog } from '@/components/headcode/admin/dialogs'
import { DefaultSkeleton } from '@/components/headcode/skeletons'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { User } from 'better-auth'
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DialogChangePassword } from './dialogs'

const getUsersColumns = (
  handleChangePassword: (user: User) => void,
  handleDelete: (user: User) => void,
  currentUserEmail: string | undefined,
): ColumnDef<User>[] => [
  {
    accessorKey: 'email',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: 'role',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Role
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const user = row.original

      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleChangePassword(user)}>
                Change password
              </DropdownMenuItem>
              {user.email !== currentUserEmail && (
                <DropdownMenuItem onClick={() => handleDelete(user)}>
                  Delete user
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )
    },
  },
]

export function UsersTable({
  update,
  setUpdate,
}: {
  update: boolean
  setUpdate: (update: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [openChangePassword, setOpenChangePassword] = useState(false)
  const [userToChangePassword, setUserToChangePassword] = useState<User | null>(
    null,
  )
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { data: session } = authClient.useSession()
  const [data, setData] = useState<User[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const userData = await authClient.admin.listUsers({ query: {} })

      setData(userData.data?.users ?? [])
      setUpdate(false)
    }

    if (update) {
      fetchData()
    }
  }, [update, setUpdate])

  const handleChangePassword = (user: User) => {
    setOpenChangePassword(true)
    setUserToChangePassword(user)
  }

  const handleDelete = (user: User) => {
    setUserToDelete(user)
    setOpen(true)
    setUpdate(true)
  }
  const columns = getUsersColumns(
    handleChangePassword,
    handleDelete,
    session?.user.email,
  )

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (userToDelete) {
      setIsDeleting(true)
      try {
        await authClient.admin.removeUser({ userId: userToDelete.id })
        setUpdate(true)
      } catch (error) {
        console.error('error deleting user', error)
      } finally {
        setIsDeleting(false)
        setOpen(false)
        setUserToDelete(null)
      }
    }
  }

  return (
    <>
      {update ? (
        <DefaultSkeleton />
      ) : (
        <UsersDataTable columns={columns} data={data} />
      )}
      <DialogChangePassword
        user={userToChangePassword}
        open={openChangePassword}
        setOpen={setOpenChangePassword}
      />
      <ConfirmationDialog
        open={open}
        setOpen={setOpen}
        title={`Delete user ${userToDelete?.email ?? ''}?`}
        description={`This action cannot be undone. This will permanently delete the user ${userToDelete?.email ?? ''} from Headcode CMS.`}
        buttonText="Delete user"
        isSubmitting={isDeleting}
        handleSubmit={handleConfirmDelete}
      />
    </>
  )
}

function UsersDataTable<TData, TValue>({
  columns,
  data,
}: {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  return (
    <div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      'px-6',
                      cell.column.id === 'email' && 'w-full',
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between py-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  isActive={table.getCanPreviousPage()}
                  onClick={() => {
                    if (table.getCanPreviousPage()) {
                      table.previousPage()
                    }
                  }}
                />
              </PaginationItem>

              {table.getPageCount() > 1 && (
                <>
                  {Array.from({ length: table.getPageCount() }).map(
                    (_, index) => (
                      <PaginationItem key={index}>
                        <PaginationLink
                          onClick={() => table.setPageIndex(index)}
                          isActive={
                            index === table.getState().pagination.pageIndex
                          }
                        >
                          {index + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}
                </>
              )}
              <PaginationItem>
                <PaginationNext
                  isActive={table.getCanNextPage()}
                  onClick={() => {
                    if (table.getCanNextPage()) {
                      table.nextPage()
                    }
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
