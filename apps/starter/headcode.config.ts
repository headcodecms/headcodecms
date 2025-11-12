import { heroSection } from './components/headcode/themes/vienna/hero'
import type { HeadcodeConfig } from './components/headcode/form/form'

export const headcodeConfig = {
  version: 'v02',
  clone: 'v01',
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
} satisfies HeadcodeConfig
