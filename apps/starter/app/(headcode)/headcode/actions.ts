'use server'

import { revalidatePath } from 'next/cache'

export async function addEntry(values: any) {
  console.log(values)
  await new Promise((resolve) => setTimeout(resolve, 2000))
  revalidatePath('/headcode/users')

  return {
    id: '1',
    namespace: 'global',
    key: 'footer',
  }
}
