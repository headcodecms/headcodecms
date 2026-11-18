'use client'

import {
  AlertTriangle,
  Check,
  Copy,
  FilePen,
  FilePlus,
  FileX,
  History,
  Loader2,
  RefreshCw,
  Rocket,
  RotateCcw,
  Undo2,
} from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import {
  ConfirmDialog,
  EmptyState,
  ErrorAlert,
  LoadingState,
} from '../../_components/admin-ui'
import { AdminShell } from '../../_components/chrome'
import { mutate, useQuery, type Change, type Snapshot } from '../../_lib/api'
import { displayPath, editorHref } from '../../_lib/entries'
import { useActions } from '../../_lib/use-actions'

const formatTime = (time: string | null) =>
  time ? new Date(time).toLocaleString() : ''

const statusText: Record<Change['status'], string> = {
  new: 'New in draft',
  changed: 'Changed in draft',
  deleted: 'Deleted in draft',
  live_newer: 'Live was changed after the draft',
}

const statusIcon: Record<Change['status'], React.ReactNode> = {
  new: <FilePlus />,
  changed: <FilePen />,
  deleted: <FileX />,
  live_newer: <AlertTriangle />,
}

type Confirm = 'publish' | 'rotate' | 'reset' | { rollback: Snapshot }

export default function PublishPage() {
  const changes = useQuery<{ changes: Change[] }>('changes_list')
  const snapshots = useQuery<{ snapshots: Snapshot[] }>('snapshots_list')
  const preview = useQuery<{ token: string }>('preview_link')
  const { pending, error, run } = useActions<'confirm' | 'copy'>()
  const [confirm, setConfirm] = React.useState<Confirm | null>(null)
  const [copied, setCopied] = React.useState(false)

  const confirming = pending.includes('confirm')
  const changeList = changes.data?.changes ?? []
  const liveNewer = changeList.filter(({ status }) => status === 'live_newer')
  const previewUrl = preview.data
    ? `${window.location.origin}/preview/${preview.data.token}`
    : ''

  const confirmAction = () => {
    if (!confirm) return
    void run(
      'confirm',
      async () => {
        if (confirm === 'publish') await mutate('publish')
        else if (confirm === 'rotate') await mutate('preview_rotate')
        else if (confirm === 'reset') await mutate('draft_reset')
        else await mutate('rollback', { snapshot: confirm.rollback.id })
        setConfirm(null)
      },
      'Could not complete the action.',
    )
  }

  const copyPreview = () =>
    run(
      'copy',
      async () => {
        await navigator.clipboard.writeText(previewUrl)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      },
      'Could not copy the link.',
    )

  const dialog =
    confirm === 'publish'
      ? {
          title: 'Publish draft?',
          description:
            liveNewer.length > 0
              ? `This makes the draft live. Live was changed after the draft for ${liveNewer.map(({ slug }) => displayPath(slug)).join(', ')}; publishing overwrites those changes.`
              : 'This makes the draft live. The previous live content stays available as a snapshot.',
          label: 'Publish',
          icon: <Rocket />,
          variant: 'default' as const,
        }
      : confirm === 'rotate'
        ? {
            title: 'Rotate preview link?',
            description:
              'This creates a new preview link. The current link stops working for everyone who has it.',
            label: 'Rotate link',
            icon: <RefreshCw />,
            variant: 'destructive' as const,
          }
        : confirm === 'reset'
          ? {
              title: 'Discard draft changes?',
              description:
                'This replaces the whole draft with the live content. All unpublished changes are lost.',
              label: 'Discard changes',
              icon: <Undo2 />,
              variant: 'destructive' as const,
            }
          : {
              title: 'Roll back live?',
              description: confirm
                ? `This makes the snapshot from ${formatTime(confirm.rollback.created_at)} live again. The current live content stays available as a snapshot; the draft is unchanged.`
                : '',
              label: 'Roll back',
              icon: <RotateCcw />,
              variant: 'default' as const,
            }

  const card = (content: React.ReactNode) => (
    <Card>
      <CardContent>{content}</CardContent>
    </Card>
  )

  const loadError = changes.error ?? snapshots.error ?? preview.error

  return (
    <AdminShell
      dialogs={
        <ConfirmDialog
          open={confirm !== null}
          onClose={() => setConfirm(null)}
          pending={confirming}
          title={dialog.title}
          description={dialog.description}
          confirmLabel={dialog.label}
          confirmIcon={dialog.icon}
          confirmVariant={dialog.variant}
          onConfirm={confirmAction}
        />
      }
    >
      {loadError ? (
        card(<ErrorAlert error={loadError} />)
      ) : !changes.data || !snapshots.data || !preview.data ? (
        card(<LoadingState>Loading changes</LoadingState>)
      ) : (
        <div className="flex flex-col gap-4">
          {card(
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="font-heading text-2xl font-semibold tracking-tight">
                    Publish
                  </h1>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Changes in the draft since the last publish. Publishing
                    makes the whole draft live.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={changeList.length === 0 || confirming}
                    onClick={() => setConfirm('reset')}
                  >
                    <Undo2 />
                    Discard draft changes
                  </Button>
                  <Button
                    disabled={changeList.length === 0 || confirming}
                    onClick={() => setConfirm('publish')}
                  >
                    {confirm === 'publish' && confirming ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Rocket />
                    )}
                    Publish
                  </Button>
                </div>
              </div>

              <ErrorAlert error={error} />

              {liveNewer.length > 0 && (
                <div
                  role="alert"
                  className="bg-destructive/10 text-destructive flex gap-3 rounded-2xl px-4 py-3 text-sm"
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <p>
                    Live was changed after the draft for{' '}
                    {liveNewer.map(({ slug }) => displayPath(slug)).join(', ')}.
                    Publishing overwrites that change.
                  </p>
                </div>
              )}

              {changeList.length === 0 ? (
                <EmptyState icon={<Check />} title="No changes">
                  The draft is the same as live.
                </EmptyState>
              ) : (
                <ItemGroup>
                  {changeList.map((change) => (
                    <ChangeItem key={change.slug} change={change} />
                  ))}
                </ItemGroup>
              )}
            </div>,
          )}

          {card(
            <div className="flex flex-col gap-5">
              <div className="min-w-0">
                <h2 className="font-heading text-xl font-semibold tracking-tight">
                  Preview link
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Everyone with this link sees the draft, no sign-in needed.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  readOnly
                  value={previewUrl}
                  aria-label="Preview link"
                  className="min-w-0 flex-1 font-mono text-xs"
                  onFocus={(event) => event.target.select()}
                />
                <Button variant="outline" onClick={copyPreview}>
                  {copied ? <Check /> : <Copy />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  variant="outline"
                  disabled={confirming}
                  onClick={() => setConfirm('rotate')}
                >
                  <RefreshCw />
                  Rotate link
                </Button>
              </div>
            </div>,
          )}

          {card(
            <div className="flex flex-col gap-5">
              <div className="min-w-0">
                <h2 className="font-heading text-xl font-semibold tracking-tight">
                  Snapshots
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  The live content before each publish and roll back. Roll back
                  to make one live again.
                </p>
              </div>
              {snapshots.data.snapshots.length === 0 ? (
                <EmptyState icon={<History />} title="No snapshots yet">
                  Every publish keeps the previous live content here.
                </EmptyState>
              ) : (
                <ItemGroup>
                  {snapshots.data.snapshots.map((snapshot) => (
                    <Item key={snapshot.id} variant="muted" size="sm">
                      <ItemMedia variant="icon">
                        <History />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>{formatTime(snapshot.created_at)}</ItemTitle>
                        <ItemDescription>
                          Before{' '}
                          {snapshot.reason === 'publish'
                            ? 'publish'
                            : 'roll back'}{' '}
                          · {snapshot.entries}{' '}
                          {snapshot.entries === 1 ? 'entry' : 'entries'}
                        </ItemDescription>
                      </ItemContent>
                      <ItemActions className="ml-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={confirming}
                          onClick={() => setConfirm({ rollback: snapshot })}
                        >
                          <RotateCcw />
                          Roll back
                        </Button>
                      </ItemActions>
                    </Item>
                  ))}
                </ItemGroup>
              )}
            </div>,
          )}
        </div>
      )}
    </AdminShell>
  )
}

const ChangeItem = ({ change }: { change: Change }) => {
  const warn = change.status === 'live_newer'
  const time =
    change.status === 'deleted'
      ? change.live_updated_at
      : change.draft_updated_at
  return (
    <Item variant="muted" size="sm">
      <ItemMedia variant="icon" className={warn ? 'text-destructive' : ''}>
        {statusIcon[change.status]}
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          {change.status === 'deleted' ? (
            displayPath(change.slug)
          ) : (
            <Link href={editorHref(change.slug)} className="hover:underline">
              {displayPath(change.slug)}
            </Link>
          )}
        </ItemTitle>
        <ItemDescription className={warn ? 'text-destructive' : ''}>
          {warn
            ? `Live changed ${formatTime(change.live_updated_at)}, after the draft (${formatTime(change.draft_updated_at)}). Publishing overwrites the live change.`
            : `${statusText[change.status]} · ${formatTime(time)}`}
        </ItemDescription>
      </ItemContent>
    </Item>
  )
}
