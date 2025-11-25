import Link from 'next/link'
import { LinkValue } from './form/link-field'

export function ALink({
  link,
  className,
}: {
  link: LinkValue
  className?: string
}) {
  return link.url.startsWith('http') ? (
    <a
      href={link.url}
      className={className}
      target={link.openInNewWindow ? '_blank' : '_self'}
    >
      {link.title}
    </a>
  ) : (
    <Link href={link.url} className={className}>
      {link.title}
    </Link>
  )
}
