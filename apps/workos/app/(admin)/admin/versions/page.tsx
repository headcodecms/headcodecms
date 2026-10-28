'use client'

import { useMutation, useQuery } from 'convex/react'
import {
  Check,
  GitBranch,
  History,
  Loader2,
  Rocket,
  RotateCcw,
  Split,
  Trash2,
} from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import {
  ConfirmDialog,
  EmptyState,
  ErrorAlert,
  LoadingState,
} from '../../_components/admin-ui'
import { AdminShell } from '../../_components/chrome'
import { useActions } from '../../_lib/use-actions'

const formatTime = (time: number) => new Date(time).toLocaleString()

type VersionAction = { type: 'restore' | 'delete'; version: Doc<'versions'> }

export default function VersionsPage() {
  const status = useQuery(api.services.getVersionStatus, {})
  const history = useQuery(api.services.getVersionHistory, {})
  const publish = useMutation(api.services.publish)
  const newDraft = useMutation(api.services.newDraft)
  const restoreLiveVersion = useMutation(api.services.restoreLiveVersion)
  const deleteVersion = useMutation(api.services.deleteVersion)
  const { pending, error, run } = useActions<'publish' | 'draft' | 'action'>()
  const [confirmPublish, setConfirmPublish] = React.useState(false)
  const [versionAction, setVersionAction] =
    React.useState<VersionAction | null>(null)

  const publishing = pending.includes('publish')
  const creatingDraft = pending.includes('draft')
  const actionPending = pending.includes('action')
  // Both are false while the dialog closes (texts: delete, button: restore).
  const isRestore = versionAction?.type === 'restore'
  const isDelete = versionAction?.type === 'delete'

  const handlePublish = () =>
    run(
      'publish',
      async () => {
        await publish({})
        setConfirmPublish(false)
      },
      'Could not publish draft.',
    )

  const handleNewDraft = () =>
    run('draft', () => newDraft({}), 'Could not create a new draft.')

  const handleVersionAction = () => {
    if (!versionAction) return
    const mutate = isDelete ? deleteVersion : restoreLiveVersion
    void run(
      'action',
      async () => {
        await mutate({ versionId: versionAction.version._id })
        setVersionAction(null)
      },
      'Could not update version history.',
    )
  }

  const card = (content: React.ReactNode) => (
    <Card>
      <CardContent>{content}</CardContent>
    </Card>
  )

  return (
    <AdminShell
      loadingLabel="Loading versions"
      dialogs={
        <>
          <ConfirmDialog
            open={confirmPublish}
            onClose={() => setConfirmPublish(false)}
            pending={publishing}
            dismissWhilePending
            title="Publish draft?"
            description="This promotes the current draft to live and creates a fresh draft from the published content."
            confirmLabel="Publish"
            confirmIcon={<Rocket />}
            onConfirm={handlePublish}
          />
          <ConfirmDialog
            open={Boolean(versionAction)}
            onClose={() => setVersionAction(null)}
            pending={actionPending}
            title={isRestore ? 'Restore live version?' : 'Delete version?'}
            description={
              isRestore
                ? 'This clones the selected version and makes the clone the new live version. The current draft is unchanged.'
                : 'This deletes the selected version and all entries and sections stored in it.'
            }
            confirmLabel={isDelete ? 'Delete' : 'Restore live'}
            confirmIcon={isDelete ? <Trash2 /> : <RotateCcw />}
            confirmVariant={isDelete ? 'destructive' : 'default'}
            onConfirm={handleVersionAction}
          />
        </>
      }
    >
      {status === undefined || history === undefined ? (
        card(<LoadingState>Loading versions</LoadingState>)
      ) : !status.live && !status.draft ? (
        card(
          <EmptyState icon={<GitBranch />} title="No versions yet">
            Create or open content first to initialize Headcode versions.
          </EmptyState>,
        )
      ) : (
        <div className="flex flex-col gap-4">
          {card(
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="font-heading text-2xl font-semibold tracking-tight">
                    Versions
                  </h1>
                  <p className="text-muted-foreground mt-2 text-sm">
                    Publish draft content to live, or split a shared live site
                    into a separate draft.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={!status.canNewDraft || creatingDraft}
                    onClick={handleNewDraft}
                  >
                    {creatingDraft ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Split />
                    )}
                    New draft
                  </Button>
                  <Button
                    disabled={!status.canPublish || publishing}
                    onClick={() => setConfirmPublish(true)}
                  >
                    {publishing ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Rocket />
                    )}
                    Publish draft
                  </Button>
                </div>
              </div>

              <ErrorAlert error={error} />

              <ItemGroup>
                <VersionItem
                  title="Live"
                  active={Boolean(status.live)}
                  description={
                    status.live
                      ? `Created ${formatTime(status.live._creationTime)}`
                      : 'No live version exists.'
                  }
                />
                <VersionItem
                  title="Draft"
                  active={Boolean(status.draft)}
                  description={
                    !status.draft
                      ? 'No draft version exists.'
                      : status.shared
                        ? 'Draft and live currently point to the same version.'
                        : `Created ${formatTime(status.draft._creationTime)}`
                  }
                />
              </ItemGroup>

              <div className="bg-muted/40 text-muted-foreground rounded-2xl px-4 py-3 text-sm">
                {status.shared
                  ? 'Live and draft are shared. Content edits are immediately visible on the live site.'
                  : 'Live and draft are separate. Publish the draft when the changes are approved.'}
              </div>
            </div>,
          )}

          {card(
            <div className="flex flex-col gap-5">
              <div className="min-w-0">
                <h2 className="font-heading text-xl font-semibold tracking-tight">
                  Version history
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Review previous versions and restore or remove retired
                  snapshots.
                </p>
              </div>

              <ItemGroup>
                {history.map((version) => (
                  <HistoryVersionItem
                    key={version._id}
                    version={version}
                    disabled={actionPending}
                    onAction={(type) => setVersionAction({ type, version })}
                  />
                ))}
              </ItemGroup>
            </div>,
          )}
        </div>
      )}
    </AdminShell>
  )
}

const VersionItem = ({
  title,
  description,
  active,
}: {
  title: string
  description: string
  active: boolean
}) => (
  <Item variant="muted" size="sm">
    <ItemMedia variant="icon">{active ? <Check /> : <GitBranch />}</ItemMedia>
    <ItemContent>
      <ItemTitle>{title}</ItemTitle>
      <ItemDescription>{description}</ItemDescription>
    </ItemContent>
  </Item>
)

const VersionLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="bg-primary/10 text-primary rounded-md px-1.5 py-0.5 font-mono text-[0.6875rem] font-medium uppercase">
    {children}
  </span>
)

const HistoryVersionItem = ({
  version,
  disabled,
  onAction,
}: {
  version: Doc<'versions'>
  disabled: boolean
  onAction: (type: VersionAction['type']) => void
}) => {
  const canRestore = !version.live
  const canDelete = !version.live && !version.draft

  return (
    <Item variant="muted" size="sm">
      <ItemMedia variant="icon">
        {version.live || version.draft ? <Check /> : <History />}
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="line-clamp-none flex-wrap">
          Created {formatTime(version._creationTime)}
          {version.live && <VersionLabel>Live</VersionLabel>}
          {version.draft && <VersionLabel>Draft</VersionLabel>}
        </ItemTitle>
        <ItemDescription className="font-mono text-xs">
          {version._id}
        </ItemDescription>
      </ItemContent>
      {canRestore && (
        <ItemActions className="ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAction('restore')}
            disabled={disabled}
          >
            <RotateCcw />
            Restore live
          </Button>
          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onAction('delete')}
              disabled={disabled}
            >
              <Trash2 />
              Delete
            </Button>
          )}
        </ItemActions>
      )}
    </Item>
  )
}
