import { Badge } from '@/components/ui/badge'
import { getVersion } from '@/lib/headcode/config'
import { GitBranchIcon } from 'lucide-react'
import Link from 'next/link'
import { Nav } from './nav'

export const Header = ({ role }: { role?: string }) => {
  return (
    <div className="flex items-center justify-between py-8">
      <Link
        href="/headcode"
        className="flex items-center gap-2 text-2xl font-bold"
      >
        Headcode
        <Badge variant="outline">
          <GitBranchIcon className="size-4" />
          {getVersion()}
        </Badge>
      </Link>
      {role && <Nav role={role} />}
    </div>
  )
}
