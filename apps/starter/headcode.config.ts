import {
  defaultFeature,
  defaultFeatureRight,
  defaultFeatures,
  defaultFeaturesText,
  defaultFeatureText,
  defaultFooter,
  defaultFooterText,
  defaultHeader,
  defaultHeaderMega,
  defaultHeaderMegaText,
  defaultHeaderText,
  defaultHero,
  defaultHeroText,
  defaultImage,
  defaultImageText,
  defaultText,
  defaultTextPreview,
  defaultTextPreviewText,
} from './components/headcode/themes/vienna/defaults'
import { featureSection } from './components/headcode/themes/vienna/feature'
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
        { name: textSection.name, data: defaultFeatureText },
        { name: featureSection.name, data: defaultFeature },
        { name: featureSection.name, data: defaultFeatureRight },
        { name: textSection.name, data: defaultTextPreview },
        { name: textSection.name + 'Resizable', data: defaultTextPreviewText },
        { name: textSection.name, data: defaultImageText },
        { name: imageSection.name, data: defaultImage },
        { name: textSection.name, data: defaultFooterText },
        { name: footerSection.name, data: defaultFooter },
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
