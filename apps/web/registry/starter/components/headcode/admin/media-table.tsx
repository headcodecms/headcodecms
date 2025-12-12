'use client'

import {
  fetchImages,
  removeImage,
} from '@/app/(headcode)/headcode/media/actions'
import { DefaultSkeleton } from '@/components/headcode/skeletons'
import { Button } from '@/components/ui/button'
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
import { compactNumber } from '@/lib/headcode/images'
import type { ImageValue } from '@/lib/headcode/types'
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
import {
  ArrowUpDown,
  Check,
  ClipboardIcon,
  ImagePlusIcon,
  Trash2,
} from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmationDialog } from './dialogs'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

type MediaTableAction = {
  label: string
  icon: React.ReactNode
  onClick: (image: ImageValue) => void
}

const getMediaColumns = (action: MediaTableAction): ColumnDef<ImageValue>[] => [
  {
    id: 'thumbnail',
    header: 'Image',
    cell: ({ row }) => {
      const image = row.original
      return (
        <div className="relative size-20 shrink-0 overflow-hidden rounded-md border">
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            className="h-full w-full object-cover"
            placeholder={image.blurDataURL ? 'blur' : undefined}
            blurDataURL={image.blurDataURL || undefined}
          />
        </div>
      )
    },
  },
  {
    accessorKey: 'name',
    id: 'details',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Details
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const image = row.original
      const handleCopyToClipboard = async () => {
        if (image.src) {
          try {
            await navigator.clipboard.writeText(image.src)
            toast.success('Copied to clipboard')
          } catch (err) {
            console.error('Failed to copy to clipboard', err)
            toast.error('Failed to copy to clipboard')
          }
        }
      }
      return (
        <div className="min-w-0 space-y-1">
          <div className="font-medium">{image.name || 'Untitled'}</div>
          <div className="flex max-w-64 min-w-0 items-center gap-2 overflow-hidden lg:max-w-lg xl:max-w-2xl 2xl:max-w-4xl">
            <span className="text-muted-foreground min-w-0 truncate text-sm">
              {image.src}
            </span>
            {image.src && (
              <button
                type="button"
                onClick={handleCopyToClipboard}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <ClipboardIcon className="size-4" />
              </button>
            )}
          </div>
          <div className="text-muted-foreground flex flex-col gap-1 text-xs sm:flex-row sm:gap-3">
            <span>
              {image.width}px × {image.height}px
            </span>
            {image.size && <span>{compactNumber(image.size)}</span>}
            {image.type && <span>{image.type}</span>}
            {image.alt && <span>ALT: {image.alt}</span>}
          </div>
        </div>
      )
    },
  },
  {
    id: 'actions',
    header: 'Action',
    cell: ({ row }) => {
      const image = row.original

      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => action.onClick(image)}
          className="flex items-center gap-2"
        >
          {action.icon}
          {action.label}
        </Button>
      )
    },
  },
]

export function MediaTable({
  action,
  onImageSelect,
}: {
  action?: MediaTableAction
  onImageSelect?: (image: ImageValue) => void
}) {
  const [open, setOpen] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<ImageValue | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [data, setData] = useState<ImageValue[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadImages = async () => {
      setIsLoading(true)
      try {
        const images = await fetchImages()
        setData(images)
      } catch (error) {
        console.error('error loading images', error)
        toast.error('Failed to load images')
      } finally {
        setIsLoading(false)
      }
    }

    loadImages()
  }, [])

  const defaultAction: MediaTableAction = {
    label: 'Delete',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: (image) => {
      setImageToDelete(image)
      setOpen(true)
    },
  }

  const selectAction: MediaTableAction = {
    label: 'Select',
    icon: <Check className="h-4 w-4" />,
    onClick: (image) => {
      if (onImageSelect) {
        onImageSelect(image)
      }
    },
  }

  const tableAction = action || (onImageSelect ? selectAction : defaultAction)
  const columns = getMediaColumns(tableAction)

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (imageToDelete && imageToDelete.id) {
      setIsDeleting(true)
      try {
        const { success, error } = await removeImage(imageToDelete.id)
        if (success) {
          setData((prev) => prev.filter((img) => img.id !== imageToDelete.id))
          toast.success('Image deleted successfully')
        } else if (error) {
          toast.error(error)
        }
      } catch (error) {
        console.error('error deleting image', error)
        toast.error('Failed to delete image')
      } finally {
        setIsDeleting(false)
        setOpen(false)
        setImageToDelete(null)
      }
    }
  }

  if (isLoading) {
    return <DefaultSkeleton />
  }

  return (
    <>
      <MediaDataTable columns={columns} data={data} />
      {!onImageSelect && (
        <ConfirmationDialog
          open={open}
          setOpen={setOpen}
          title={`Delete image ${imageToDelete?.name || 'Untitled'}?`}
          description={`This action cannot be undone. This will permanently delete the image from Headcode CMS.`}
          buttonText="Delete image"
          isSubmitting={isDeleting}
          handleSubmit={handleConfirmDelete}
        />
      )}
    </>
  )
}

function MediaDataTable<TData, TValue>({
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
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  return (
    <div>
      <div className="overflow-hidden rounded-md border">
        <Table className="w-full">
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
                        cell.column.id === 'details' && 'w-full min-w-0',
                        cell.column.id === 'actions' && 'whitespace-nowrap',
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
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <ImagePlusIcon />
                      </EmptyMedia>
                      <EmptyTitle>No images found</EmptyTitle>
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
