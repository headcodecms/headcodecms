import { featuresSection } from './components/headcode/themes/vienna/features'
import { footerSection } from './components/headcode/themes/vienna/footer'
import { headerSection } from './app/(site)/header'
import { heroSection } from './app/(site)/hero'
import { heroSection as viennaHeroSection } from '@/components/headcode/themes/vienna/hero'
import { imageSection } from './components/headcode/themes/vienna/image'
import { textSection } from './components/headcode/themes/vienna/text'
import type { HeadcodeConfig } from './lib/headcode/types'

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
      sections: [{ section: heroSection }, { section: textSection }],
    },
  ],
}
