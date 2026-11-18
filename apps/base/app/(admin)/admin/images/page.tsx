'use client'

import { Check, Copy, ImageIcon, Search, Trash2 } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  ConfirmDialog,
  EmptyState,
  ErrorAlert,
  LoadingState,
} from '../../_components/admin-ui'
import { AdminShell } from '../../_components/chrome'
import {
  dimensions,
  formatBytes,
  Thumb,
  UploadArea,
} from '../../_components/media'
import { mutate, useQuery, type Media } from '../../_lib/api'
import { useActions } from '../../_lib/use-actions'

export default function AdminImagesPage() {
  const list = useQuery<{ media: Media[] }>('media_list')
  const [query, setQuery] = React.useState('')
  const [copied, setCopied] = React.useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Media | null>(null)
  const { pending, error, run } = useActions<'delete'>()
  const search = query.trim().toLowerCase()
  const media = (list.data?.media ?? []).filter((item) =>
    `${item.alt} ${item.pathname} ${item.content_type}`
      .toLowerCase()
      .includes(search),
  )

  const copyUrl = async (item: Media) => {
    await navigator.clipboard.writeText(
      new URL(item.src, window.location.origin).href,
    )
    setCopied(item.id)
    window.setTimeout(() => setCopied(null), 1200)
  }

  const deleteMedia = () => {
    const id = deleteTarget?.id
    if (!id) return
    void run(
      'delete',
      async () => {
        await mutate('media_delete', { id })
        setDeleteTarget(null)
      },
      'Could not delete image.',
    )
  }

  return (
    <AdminShell
      dialogs={
        <ConfirmDialog
          open={deleteTarget !== null}
          onClose={() => setDeleteTarget(null)}
          pending={pending.includes('delete')}
          title="Delete image"
          description="This deletes the file. Entries that use it show a broken image until you choose another one."
          confirmLabel="Delete"
          confirmIcon={<Trash2 />}
          confirmVariant="destructive"
          onConfirm={deleteMedia}
        />
      }
    >
      <Card>
        <CardContent>
          <div className="mb-6 flex flex-col gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Images
            </h1>
            <p className="text-muted-foreground text-sm">
              Upload images and remove the ones you no longer need. Image fields
              copy the image, so set them in the entries.
            </p>
          </div>

          <UploadArea multiple />

          <InputGroup className="mt-6">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search images..."
            />
          </InputGroup>

          <ErrorAlert error={error ?? list.error ?? null} className="mt-4" />

          <div className="mt-6">
            {!list.data ? (
              list.error ? null : (
                <LoadingState>Loading images...</LoadingState>
              )
            ) : media.length === 0 ? (
              <EmptyState icon={<ImageIcon />} title="No images found">
                Upload images here or from an image field.
              </EmptyState>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {media.map((item) => (
                  <li
                    key={item.id}
                    className="bg-muted/30 flex flex-col overflow-hidden rounded-xl border"
                  >
                    <div className="bg-muted relative aspect-square w-full">
                      <Thumb src={item.src} alt={item.alt} />
                    </div>
                    <div className="flex flex-col gap-0.5 p-3">
                      <p className="truncate text-sm font-medium">
                        {item.alt || item.pathname}
                      </p>
                      <p className="text-muted-foreground truncate font-mono text-xs">
                        {[dimensions(item), formatBytes(item.size)]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <div className="mt-auto flex items-center gap-1 px-2 pb-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void copyUrl(item)}
                      >
                        {copied === item.id ? <Check /> : <Copy />}
                        {copied === item.id ? 'Copied' : 'Copy URL'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Delete image"
                        className="text-destructive hover:text-destructive ml-auto"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </AdminShell>
  )
}
