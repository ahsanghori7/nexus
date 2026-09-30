import i18next from 'v2/helpers/i18n';

const prevPage = {
  ncr: 'ncr',
  'instructions-variations': 'instructions_variations',
};

const instructionsBreadcrumbs = (
  slug,
  type,
  title,
  data = {},
  extraBreadcrumb = false,
  edit = false,
  reactLink = true
) =>
  [
    {
      id: 1,
      text: i18next.t('clink-projects-title'),
      url: `${BASE_URLS.CLINK}`,
    },
    {
      id: 2,
      text: data.name || '',
      url: `${BASE_URLS.CLINK}/project_dashboard/${slug}`,
      reactLink,
    },
    {
      id: 3,
      text: title,
      url: `${BASE_URLS.CLINK}/project/${slug}/${prevPage[type]}`,
      reactLink,
    },
    extraBreadcrumb
      ? {
          id: 4,
          text: `${edit ? 'Edit' : 'Add'} ${title}`,
        }
      : null,
  ].filter(Boolean);

export { instructionsBreadcrumbs };
