'use client'

import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
  useMutation,
  useQuery,
} from 'convex/react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
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
import type { Id } from '@/convex/_generated/dataModel'
import { AdminHeader } from '../../_components/chrome'
import { Container } from '../../_components/container'
import { useAdminHeadcodeVersion } from '../../_lib/headcode'

const formatTime = (time?: number) =>
  typeof time === 'number' ? new Date(time).toLocaleString() : 'Not available'

type VersionHistoryItem = {
  _id: Id<'versions'>
  _creationTime: number
  live: boolean
  draft: boolean
  prepare: boolean
}

type VersionAction = {
  type: 'restore' | 'delete'
  version: VersionHistoryItem
}

export default function VersionsPage() {
  const { version, resolved: versionResolved } = useAdminHeadcodeVersion()
  const status = useQuery(api.services.getVersionStatus, {})
  const history = useQuery(api.services.getVersionHistory, {})
  const publish = useMutation(api.services.publish)
  const newDraft = useMutation(api.services.newDraft)
  const restoreLiveVersion = useMutation(api.services.restoreLiveVersion)
  const deleteVersion = useMutation(api.services.deleteVersion)
  const [publishing, setPublishing] = React.useState(false)
  const [creatingDraft, setCreatingDraft] = React.useState(false)
  const [confirmPublish, setConfirmPublish] = React.useState(false)
  const [versionAction, setVersionAction] =
    React.useState<VersionAction | null>(null)
  const [versionActionPending, setVersionActionPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handlePublish = async () => {
    setPublishing(true)
    setError(null)

    try {
      await publish({})
      setConfirmPublish(false)
    } catch (publishError) {
      setError(
        publishError instanceof Error
          ? publishError.message
          : 'Could not publish draft.',
      )
    } finally {
      setPublishing(false)
    }
  }

  const handleNewDraft = async () => {
    setCreatingDraft(true)
    setError(null)

    try {
      await newDraft({})
    } catch (draftError) {
      setError(
        draftError instanceof Error
          ? draftError.message
          : 'Could not create a new draft.',
      )
    } finally {
      setCreatingDraft(false)
    }
  }

  const handleVersionAction = async () => {
    if (!versionAction) return

    setVersionActionPending(true)
    setError(null)

    try {
      if (versionAction.type === 'restore') {
        await restoreLiveVersion({ versionId: versionAction.version._id })
      } else {
        await deleteVersion({ versionId: versionAction.version._id })
      }
      setVersionAction(null)
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : 'Could not update version history.',
      )
    } finally {
      setVersionActionPending(false)
    }
  }

  const versionActionTitle =
    versionAction?.type === 'restore'
      ? 'Restore live version?'
      : 'Delete version?'
  const versionActionDescription =
    versionAction?.type === 'restore'
      ? 'This clones the selected version and makes the clone the new live version. The current draft is unchanged.'
      : 'This deletes the selected version and all entries and sections stored in it.'

  return (
    <div className="bg-background min-h-svh">
      <AdminHeader version={version} versionResolved={versionResolved} />
      <main>
        <Container className="py-8">
          <AuthLoading>
            <LoadingState />
          </AuthLoading>
          <Unauthenticated>
            <p className="text-muted-foreground text-sm">Signing in...</p>
          </Unauthenticated>
          <Authenticated>
            {status === undefined || history === undefined ? (
              <Card>
                <CardContent>
                  <LoadingState />
                </CardContent>
              </Card>
            ) : !status.live && !status.draft ? (
              <Card>
                <CardContent>
                  <Empty className="border">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <GitBranch />
                      </EmptyMedia>
                      <EmptyTitle>No versions yet</EmptyTitle>
                      <EmptyDescription>
                        Create or open content first to initialize Headcode
                        versions.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-4">
                <Card>
                  <CardContent>
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h1 className="font-heading text-2xl font-semibold tracking-tight">
                            Versions
                          </h1>
                          <p className="text-muted-foreground mt-2 text-sm">
                            Publish draft content to live, or split a shared
                            live site into a separate draft.
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

                      {error ? (
                        <p role="alert" className="text-destructive text-sm">
                          {error}
                        </p>
                      ) : null}

                      <ItemGroup>
                        <VersionItem
                          title="Live"
                          description={
                            status.live
                              ? `Created ${formatTime(status.live._creationTime)}`
                              : 'No live version exists.'
                          }
                          active={Boolean(status.live)}
                        />
                        <VersionItem
                          title="Draft"
                          description={
                            status.draft
                              ? status.shared
                                ? 'Draft and live currently point to the same version.'
                                : `Created ${formatTime(status.draft._creationTime)}`
                              : 'No draft version exists.'
                          }
                          active={Boolean(status.draft)}
                        />
                      </ItemGroup>

                      <div className="bg-muted/40 text-muted-foreground rounded-2xl px-4 py-3 text-sm">
                        {status.shared
                          ? 'Live and draft are shared. Content edits are immediately visible on the live site.'
                          : 'Live and draft are separate. Publish the draft when the changes are approved.'}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
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
                        {history.map((historyVersion) => (
                          <HistoryVersionItem
                            key={historyVersion._id}
                            version={historyVersion}
                            disabled={versionActionPending}
                            onRestore={() =>
                              setVersionAction({
                                type: 'restore',
                                version: historyVersion,
                              })
                            }
                            onDelete={() =>
                              setVersionAction({
                                type: 'delete',
                                version: historyVersion,
                              })
                            }
                          />
                        ))}
                      </ItemGroup>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </Authenticated>
        </Container>
      </main>

      <Dialog open={confirmPublish} onOpenChange={setConfirmPublish}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish draft?</DialogTitle>
            <DialogDescription>
              This promotes the current draft to live and creates a fresh draft
              from the published content.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmPublish(false)}
              disabled={publishing}
            >
              Cancel
            </Button>
            <Button onClick={handlePublish} disabled={publishing}>
              {publishing ? <Loader2 className="animate-spin" /> : <Rocket />}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(versionAction)}
        onOpenChange={(open) => {
          if (!open && !versionActionPending) setVersionAction(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{versionActionTitle}</DialogTitle>
            <DialogDescription>{versionActionDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVersionAction(null)}
              disabled={versionActionPending}
            >
              Cancel
            </Button>
            <Button
              variant={
                versionAction?.type === 'delete' ? 'destructive' : 'default'
              }
              onClick={handleVersionAction}
              disabled={versionActionPending}
            >
              {versionActionPending ? (
                <Loader2 className="animate-spin" />
              ) : versionAction?.type === 'delete' ? (
                <Trash2 />
              ) : (
                <RotateCcw />
              )}
              {versionAction?.type === 'delete' ? 'Delete' : 'Restore live'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function VersionItem({
  title,
  description,
  active,
}: {
  title: string
  description: string
  active: boolean
}) {
  return (
    <Item variant="muted" size="sm">
      <ItemMedia variant="icon">{active ? <Check /> : <GitBranch />}</ItemMedia>
      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
        <ItemDescription>{description}</ItemDescription>
      </ItemContent>
    </Item>
  )
}

function VersionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-primary/10 text-primary rounded-md px-1.5 py-0.5 font-mono text-[0.6875rem] font-medium uppercase">
      {children}
    </span>
  )
}

function HistoryVersionItem({
  version,
  disabled,
  onRestore,
  onDelete,
}: {
  version: VersionHistoryItem
  disabled: boolean
  onRestore: () => void
  onDelete: () => void
}) {
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
          {version.live ? <VersionLabel>Live</VersionLabel> : null}
          {version.draft ? <VersionLabel>Draft</VersionLabel> : null}
        </ItemTitle>
        <ItemDescription className="font-mono text-xs">
          {version._id}
        </ItemDescription>
      </ItemContent>
      {canRestore || canDelete ? (
        <ItemActions className="ml-auto">
          {canRestore ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onRestore}
              disabled={disabled}
            >
              <RotateCcw />
              Restore live
            </Button>
          ) : null}
          {canDelete ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={disabled}
            >
              <Trash2 />
              Delete
            </Button>
          ) : null}
        </ItemActions>
      ) : null}
    </Item>
  )
}

const LoadingState = () => (
  <div className="text-muted-foreground flex items-center gap-2 text-sm">
    <Loader2 className="size-4 animate-spin" />
    Loading versions
  </div>
)
