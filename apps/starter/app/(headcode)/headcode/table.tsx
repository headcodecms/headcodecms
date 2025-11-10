'use client'

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

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
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Empty,
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
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import {
  FileStackIcon,
  LayoutPanelTopIcon,
  MoreHorizontal,
  SquareIcon,
  XCircleIcon,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Entry } from '@/lib/headcode/entries'

const getEntriesColumns = (
  handleEdit: (entry: Entry) => void,
  handleDelete: (entry: Entry) => void,
): ColumnDef<Entry>[] => [
  {
    accessorKey: 'isDynamic',
    header: '',
    cell: ({ row }) => {
      const entry = row.original
      return entry.isDynamic ? <FileStackIcon className="size-4" /> : null
    },
  },
  {
    accessorKey: 'namespace',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Namespace
        </Button>
      )
    },
  },
  {
    accessorKey: 'key',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Key
        </Button>
      )
    },
  },
  {
    accessorKey: 'title',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Title
        </Button>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const entry = row.original

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
              <DropdownMenuItem onClick={() => handleEdit(entry)}>
                Edit entry
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(entry)}>
                Delete entry
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )
    },
  },
]

export function EntriesTable({ data }: { data: Entry[] }) {
  const [open, setOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<Entry | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = (entry: Entry) => {
    setEntryToDelete(entry)
    setOpen(true)
  }

  const handleEdit = (entry: Entry) => {
    router.push(`/headcode/section/${entry.id}`)
  }

  const columns = getEntriesColumns(handleEdit, handleDelete)

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (entryToDelete) {
      console.log('deleting entry', entryToDelete)
      setIsDeleting(true)
      try {
        // const result = await deleteEntry(entryToDelete.id)
        console.log('entry deleted successfully')
      } catch (error) {
        console.error('error deleting entry', error)
      } finally {
        setIsDeleting(false)
        setOpen(false)
        setEntryToDelete(null)
      }
    }
  }

  return (
    <>
      <EntriesDataTable columns={columns} data={data} handleEdit={handleEdit} />
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete entry {entryToDelete?.namespace} / {entryToDelete?.key}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              entry {entryToDelete?.namespace} / {entryToDelete?.key} from
              Headcode CMS.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={handleConfirmDelete}
            >
              {isDeleting && <Spinner />}
              Delete entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function EntriesDataTable<TData, TValue>({
  columns,
  data,
  handleEdit,
}: {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  handleEdit: (entry: TData) => void
}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  })

  return (
    <div>
      <div className="flex items-center pb-4">
        <Select
          value={
            (table.getColumn('namespace')?.getFilterValue() as string) ?? ''
          }
          onValueChange={(value) =>
            table
              .getColumn('namespace')
              ?.setFilterValue(value === '_clear' ? '' : value)
          }
        >
          <SelectTrigger className="min-w-[120px]">
            <SelectValue placeholder="Filter by namespace" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_clear" className="flex items-center gap-2">
              <XCircleIcon className="size-4" />
              <span>Clear filter</span>
            </SelectItem>
            <SelectSeparator />
            <SelectItem value="global" className="flex items-center gap-2">
              <SquareIcon className="size-4 text-transparent" />
              <span>Global</span>
            </SelectItem>
            <SelectItem value="blog" className="flex items-center gap-2">
              <FileStackIcon className="size-4" />
              <span>Blog</span>
            </SelectItem>
            <SelectItem value="pages" className="flex items-center gap-2">
              <FileStackIcon className="size-4" />
              <span>Pages</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
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
                  className="cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      {...(cell.column.id !== 'actions' && {
                        onClick: () => {
                          handleEdit(row.original)
                        },
                      })}
                      className={cn(
                        'px-6',
                        cell.column.id === 'title' && 'w-full',
                        cell.column.id === 'isDynamic' && 'pr-2 pl-6',
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
                        <LayoutPanelTopIcon />
                      </EmptyMedia>
                      <EmptyTitle>No content entries found</EmptyTitle>
                    </EmptyHeader>
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
