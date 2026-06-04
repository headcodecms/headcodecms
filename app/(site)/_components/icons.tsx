import {
  ArrowRight,
  BookOpen,
  Check,
  Database,
  Eye,
  Layers,
  Network,
  Newspaper,
  PlayCircle,
  Rocket,
  Sparkles,
  Workflow,
  Zap,
} from 'lucide-react'
import * as React from 'react'

export type SiteIcon = React.ComponentType<{ className?: string }>

export const iconMap: Record<string, SiteIcon | null> = {
  none: null,
  'arrow-right': ArrowRight,
  'book-open': BookOpen,
  check: Check,
  database: Database,
  eye: Eye,
  layers: Layers,
  network: Network,
  newspaper: Newspaper,
  'play-circle': PlayCircle,
  rocket: Rocket,
  sparkles: Sparkles,
  workflow: Workflow,
  zap: Zap,
}

export const getSiteIcon = (name?: string | null) =>
  name ? (iconMap[name] ?? null) : null

export const renderSiteIcon = (
  name: string | null | undefined,
  className: string,
) => {
  const Icon = getSiteIcon(name)
  return Icon ? React.createElement(Icon, { className }) : null
}
