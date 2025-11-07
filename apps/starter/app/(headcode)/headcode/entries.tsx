import { Entry } from './entries-columns'
import { EntriesTable } from './entries-table'

async function getEntries(): Promise<Entry[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return [
    {
      id: '1',
      namespace: 'global',
      key: 'footer',
      title: 'Footer',
      isDynamic: false,
    },
    {
      id: '2',
      namespace: 'blog',
      key: 'post-1',
      title: 'Post 1',
      isDynamic: true,
    },
    {
      id: '3',
      namespace: 'blog',
      key: 'post-2',
      title: 'Post 2',
      isDynamic: true,
    },
  ]
}

export async function Entries() {
  const data = await getEntries()

  return <EntriesTable data={data} />
}
