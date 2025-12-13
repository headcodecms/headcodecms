import { defaultHeader } from './app/(site)/layout'
import { defaultFeatures, defaultHero, defaultText } from './app/(site)/page'
import { featuresSection } from './components/headcode/themes/vienna/features'
import { footerSection } from './components/headcode/themes/vienna/footer'
import { headerSection } from './components/headcode/themes/vienna/header'
import { heroSection } from './components/headcode/themes/vienna/hero'
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
      defaultSections: [
        {
          section: heroSection,
          defaultValues: defaultHero,
        },
        {
          section: textSection,
          defaultValues: defaultText,
        },
        {
          section: featuresSection,
          defaultValues: defaultFeatures,
        },
        {
          section: textSection,
          defaultValues: defaultText,
        },
      ],
    },
    {
      namespace: 'global',
      key: 'header',
      sections: [{ section: headerSection, pinned: true }],
      defaultSections: [
        {
          section: headerSection,
          defaultValues: defaultHeader,
        },
      ],
    },
    {
      namespace: 'global',
      key: 'footer',
      sections: [{ section: footerSection, pinned: true }],
    },
    {
      namespace: 'pages',
      sections: [{ section: heroSection }, { section: textSection }],
      defaultSections: [
        {
          section: heroSection,
          defaultValues: defaultHero,
        },
        {
          section: textSection,
          defaultValues: defaultText,
        },
      ],
    },
  ],
}
