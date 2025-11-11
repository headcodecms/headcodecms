import Link from 'next/link'
import { Nav } from './nav'
import { Badge } from '@/components/ui/badge'
import { GitBranchIcon } from 'lucide-react'
import { headcodeConfig } from '@/headcode.config'

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
          {headcodeConfig.version}
        </Badge>
      </Link>
      {role && <Nav role={role} />}
    </div>
  )
}
