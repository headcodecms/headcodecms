import type { User } from './users-columns'
import { UsersTable } from './users-table'

async function getUsers(): Promise<User[]> {
  await new Promise((resolve) => setTimeout(resolve, 2000))
  return [
    {
      id: '1',
      email: 'matthew@example.com',
      role: 'admin',
    },
    {
      id: '2',
      email: 'jane@example.com',
      role: 'editor',
    },
    {
      id: '3',
      email: 'john@example.com',
      role: 'editor',
    },
    {
      id: '4',
      email: 'jane@example.com',
      role: 'admin',
    },
  ]
}

export async function Users() {
  const data = await getUsers()

  return <UsersTable data={data} />
}
