import { Header } from '@/components/headcode/themes/vienna/header'
import { getSections } from '@/lib/headcode'
import { Section } from '@/lib/headcode/types'
import { cacheTag } from 'next/cache'
import DefaultLogo from '@/public/headcode-logo.svg'

const defaultHero = {}

const defaultText = {}

export async function HomepageSection() {
  'use cache'
  cacheTag('/headcode/entries/global/home')

  const sections = await getSections('global', 'home')

  return <div>Homepage</div>
}
