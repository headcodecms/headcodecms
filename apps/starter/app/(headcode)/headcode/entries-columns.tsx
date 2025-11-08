'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ColumnDef } from '@tanstack/react-table'
import { FileStackIcon, MoreHorizontal } from 'lucide-react'

export type Entry = {
  id: string
  namespace: string
  key: string
  title: string
  isDynamic: boolean
}

export const getEntriesColumns = (
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
