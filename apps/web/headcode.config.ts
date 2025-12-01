import { heroSection as viennaHeroSection } from '@/components/headcode/themes/vienna/hero'
import { codeSection } from './components/headcode/themes/custom/code'
import { headerSection } from './components/headcode/themes/custom/header'
import { heroSection } from './components/headcode/themes/custom/hero'
import { snippetSection } from './components/headcode/themes/custom/snippet'
import { featuresSection } from './components/headcode/themes/vienna/features'
import { footerSection } from './components/headcode/themes/vienna/footer'
import { imageSection } from './components/headcode/themes/vienna/image'
import { textSection } from './components/headcode/themes/vienna/text'
import type { HeadcodeConfig } from './lib/headcode/types'
import { docsMetaSection } from './app/(site)/docs/[slug]/docs-meta'

export const headcodeConfig: HeadcodeConfig = {
  version: 'v01',
  // clone: 'v01',
  entries: [
    {
      namespace: 'global',
      key: 'home',
      sections: [
        { section: heroSection },
        { section: featuresSection },
        { section: textSection },
        { section: imageSection },
        { section: codeSection },
      ],
    },
    {
      namespace: 'global',
      key: 'community',
      sections: [
        { section: viennaHeroSection },
        { section: textSection },
        { section: imageSection },
      ],
    },
    {
      namespace: 'global',
      key: 'header',
      sections: [{ section: headerSection, pinned: true }],
    },
    {
      namespace: 'global',
      key: 'footer',
      sections: [{ section: footerSection, pinned: true }],
    },
    {
      namespace: 'docs',
      sections: [
        { section: docsMetaSection, pinned: true },
        { section: textSection },
        { section: snippetSection },
        { section: codeSection },
        { section: imageSection },
      ],
    },
  ],
}
