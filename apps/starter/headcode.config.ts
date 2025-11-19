import { heroSection } from './components/headcode/themes/vienna/hero'
import type { HeadcodeConfig } from './lib/headcode/types'

export const headcodeConfig: HeadcodeConfig = {
  version: 'v04',
  clone: 'v03',
  entries: [
    {
      namespace: 'global',
      key: 'homepage',
      sections: [
        { section: heroSection, pinned: true },
        { section: heroSection },
      ],
    },
    {
      namespace: 'global',
      key: 'footer',
      sections: [{ section: heroSection, pinned: true }],
    },
    {
      namespace: 'global',
      key: 'contact',
      sections: [{ section: heroSection }],
    },
    {
      namespace: 'global',
      key: 'company',
      sections: [{ section: heroSection }],
    },
    {
      namespace: 'pages',
      sections: [
        { section: heroSection, pinned: true },
        { section: heroSection },
      ],
    },
  ],
}
