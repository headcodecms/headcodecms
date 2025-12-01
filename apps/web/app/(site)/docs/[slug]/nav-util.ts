export const getNav = (
  metas: {
    slug: string
    title: string
    group: string
    order: string
  }[],
  slug?: string,
) => {
  return [
    {
      title: 'Overview',
      items: metas
        .filter((meta) => meta.group === 'overview')
        .map((meta) => ({
          title: meta.title,
          url: `/docs/${meta.slug}`,
          isActive: meta.slug === slug,
        })),
    },
    {
      title: 'Themes',
      items: metas
        .filter((meta) => meta.group === 'themes')
        .map((meta) => ({
          title: meta.title,
          url: `/docs/${meta.slug}`,
          isActive: meta.slug === slug,
        })),
    },
    {
      title: 'Admin',
      items: metas
        .filter((meta) => meta.group === 'admin')
        .map((meta) => ({
          title: meta.title,
          url: `/docs/${meta.slug}`,
          isActive: meta.slug === slug,
        })),
    },
    {
      title: 'Fields',
      items: metas
        .filter((meta) => meta.group === 'fields')
        .map((meta) => ({
          title: meta.title,
          url: `/docs/${meta.slug}`,
          isActive: meta.slug === slug,
        })),
    },
    {
      title: 'Database',
      items: metas
        .filter((meta) => meta.group === 'database')
        .map((meta) => ({
          title: meta.title,
          url: `/docs/${meta.slug}`,
          isActive: meta.slug === slug,
        })),
    },
    {
      title: 'Storage',
      items: metas
        .filter((meta) => meta.group === 'storage')
        .map((meta) => ({
          title: meta.title,
          url: `/docs/${meta.slug}`,
          isActive: meta.slug === slug,
        })),
    },
    {
      title: 'Auth',
      items: metas
        .filter((meta) => meta.group === 'auth')
        .map((meta) => ({
          title: meta.title,
          url: `/docs/${meta.slug}`,
          isActive: meta.slug === slug,
        })),
    },
  ]
}
