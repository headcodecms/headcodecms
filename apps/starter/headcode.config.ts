import {
  defaultFeatures,
  defaultFeaturesText,
  defaultHeader,
  defaultHeaderMega,
  defaultHeaderMegaText,
  defaultHeaderText,
  defaultHero,
  defaultHeroText,
  defaultText,
} from './components/headcode/themes/vienna/defaults'
import { featuresSection } from './components/headcode/themes/vienna/features'
import { footerSection } from './components/headcode/themes/vienna/footer'
import { headerSection } from './components/headcode/themes/vienna/header'
import { headerMegaSection } from './components/headcode/themes/vienna/header-mega'
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
        { name: heroSection.name, data: defaultHero },
        { name: textSection.name, data: defaultText },
        { name: featuresSection.name, data: defaultFeatures },
      ],
    },
    {
      namespace: 'global',
      key: 'header',
      sections: [{ section: headerSection, pinned: true }],
      defaultSections: [
        {
          name: headerSection.name,
          data: defaultHeader,
          pinned: true,
        },
      ],
    },
    {
      namespace: 'global',
      key: 'footer',
      sections: [{ section: footerSection, pinned: true }],
    },
    {
      namespace: 'global',
      key: 'sections',
      sections: [{ section: headerSection }],
      defaultSections: [
        { name: textSection.name, data: defaultHeaderMegaText },
        { name: headerMegaSection.name, data: defaultHeaderMega },
        { name: textSection.name, data: defaultHeaderText },
        { name: headerSection.name, data: defaultHeader },
        { name: textSection.name, data: defaultHeroText },
        { name: heroSection.name, data: defaultHero },
        { name: textSection.name, data: defaultFeaturesText },
        { name: featuresSection.name, data: defaultFeatures },
      ],
    },
    {
      namespace: 'pages',
      sections: [{ section: heroSection }, { section: textSection }],
      defaultSections: [
        { name: heroSection.name, data: defaultHero },
        { name: textSection.name, data: defaultText },
      ],
    },
  ],
}
