'use client'

import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
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
import { PlusIcon, UserRoundPlusIcon } from 'lucide-react'
import { useState } from 'react'
import { getUsersColumns, User } from './users-columns'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Spinner } from '@/components/ui/spinner'
import { deleteUser } from './actions'
import { cn } from '@/lib/utils'

export function UsersTable({ data }: { data: User[] }) {
  const [open, setOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = (user: User) => {
    setUserToDelete(user)
    setOpen(true)
  }
  const columns = getUsersColumns(handleDelete)

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (userToDelete) {
      console.log('deleting user', userToDelete)
      setIsDeleting(true)
      try {
        const result = await deleteUser(userToDelete.id)
        console.log('user deleted successfully', result)
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
      <UsersDataTable columns={columns} data={data} />
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete user {userToDelete?.email}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              user {userToDelete?.email} from Headcode CMS.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={handleConfirmDelete}
            >
              {isDeleting && <Spinner />}
              Delete user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <UserRoundPlusIcon />
                      </EmptyMedia>
                      <EmptyTitle>Add an admin user to get started</EmptyTitle>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button>
                        <PlusIcon className="size-4" />
                        Add admin user
                      </Button>
                    </EmptyContent>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
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
