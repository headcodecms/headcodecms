'use client'

// The site's global CSS. vinext attaches CSS that a server layout imports to
// the RSC entry, so the admin would load it too. CSS imported by a client
// component loads only where the component renders.
import '../../globals.css'

export function SiteStyles() {
  return null
}
