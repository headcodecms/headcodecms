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

import { ConfirmationDialog } from '@/components/headcode/admin/dialogs'
import { Button } from '@/components/ui/button'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { UIEntry, UIEntryType } from '@/lib/headcode/types'
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
import { toast } from 'sonner'
import { addEntry, deleteEntry } from './actions'

const getEntriesColumns = (
  handleEdit: (entry: UIEntry) => void,
  handleDelete: (entry: UIEntry) => void,
): ColumnDef<UIEntry>[] => [
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
              {entry.isDynamic && (
                <DropdownMenuItem onClick={() => handleDelete(entry)}>
                  Delete entry
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )
    },
  },
]

export function EntriesTable({
  version,
  data,
  entryTypes,
}: {
  version: string
  data: UIEntry[]
  entryTypes: UIEntryType[]
}) {
  const [open, setOpen] = useState(false)
  const [entryToDelete, setEntryToDelete] = useState<UIEntry | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = (entry: UIEntry) => {
    setEntryToDelete(entry)
    setOpen(true)
  }

  const handleEdit = async (entry: UIEntry) => {
    let id = entry.id
    if (!id) {
      const { entry: newEntry, error } = await addEntry({
        version,
        namespace: entry.namespace,
        key: entry.key,
      })

      if (newEntry) {
        id = newEntry.id
      } else if (error) {
        toast.warning(error)
      }
    }

    if (id) {
      router.push(`/headcode/section/${id}`)
    }
  }

  const columns = getEntriesColumns(handleEdit, handleDelete)

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (entryToDelete) {
      setIsDeleting(true)
      if (entryToDelete.id) {
        const { success, error } = await deleteEntry(entryToDelete.id)
        if (success) {
          toast.success('Entry deleted successfully')
        } else if (error) {
          toast.warning(error)
        }
      }

      setIsDeleting(false)
      setOpen(false)
      setEntryToDelete(null)
    }
  }

  return (
    <>
      <EntriesDataTable
        columns={columns}
        data={data}
        entryTypes={entryTypes}
        handleEdit={handleEdit}
      />
      <ConfirmationDialog
        open={open}
        setOpen={setOpen}
        title={`Delete entry ${entryToDelete?.namespace} / ${entryToDelete?.key}?`}
        description={`This action cannot be undone. This will permanently delete the entry ${entryToDelete?.namespace} / ${entryToDelete?.key} from Headcode CMS.`}
        buttonText="Delete entry"
        isSubmitting={isDeleting}
        handleSubmit={handleConfirmDelete}
      />
    </>
  )
}

export function EntriesDataTable<TData, TValue>({
  columns,
  data,
  entryTypes,
  handleEdit,
}: {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  entryTypes: UIEntryType[]
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
            {entryTypes.map((entryType) => (
              <SelectItem
                key={entryType.namespace}
                value={entryType.namespace}
                className="flex items-center gap-2"
              >
                {entryType.dynamic ? (
                  <FileStackIcon className="size-4" />
                ) : (
                  <SquareIcon className="size-4 text-transparent" />
                )}
                <span>{entryType.namespace}</span>
              </SelectItem>
            ))}
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
                        cell.column.id === 'key' && 'w-full',
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
