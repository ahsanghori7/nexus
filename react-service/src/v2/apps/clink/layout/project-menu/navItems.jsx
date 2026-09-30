// TODO: TO move to Layout when migration is done
import i18next from 'v2/helpers/i18n';
import { CONSTANTS } from 'clink-components';
import oldNavItems from './oldNavItems';
import flag from 'v2/helpers/flags';
import { assistant } from 'v2/helpers/roles';

const {
  instructions,
  ncr,
  pmp,
  project: projectS3,
  tools,
  forecast,
} = CONSTANTS.s3;

const navItems = (slug = '', clinkAccount = null) => {
  const hasTR = clinkAccount?.features?.some(
    (f) => f.name === 'TENDER_RECOMMENDATION',
  );
  // Default: editable (covers missing clinkAccount and ACL-disabled accounts)
  const isEditable = clinkAccount?.acl?.projectList?.canEdit ?? true;
  if (!flag('PROJECT_MENU_MIGRATION') && !hasTR) {
    return oldNavItems(slug, isEditable);
  }

  const userType = clinkAccount?.user?.type ?? '';
  const showSubMenu = isEditable && userType !== assistant.value;

  return [
    ...(isEditable
      ? [
          {
            icon: pmp,
            label: i18next.t('project-setup'),
            urls: [
              ...(showSubMenu
                ? [
                    {
                      label: i18next.t('project-overview'),
                      url: `/projects/${slug}/setup`,
                      external: true,
                    },
                  ]
                : []),
              ...(showSubMenu
                ? [
                    {
                      label: i18next.t('project-team'),
                      url: `/projects/${slug}/setup/project_team`,
                      external: true,
                    },
                  ]
                : []),
              ...(showSubMenu
                ? [
                    {
                      label: i18next.t('scope-and-details'),
                      url: `/projects/${slug}/setup/scope_details`,
                      external: true,
                    },
                  ]
                : []),
              ...(showSubMenu
                ? [
                    {
                      label: i18next.t('reference-files'),
                      url: `/projects/${slug}/setup/reference_files`,
                      external: true,
                    },
                  ]
                : []),
              {
                label: i18next.t('work-packages'),
                url: `/projects/${slug}/setup/work_packages`,
                external: true,
              },
            ],
          },
        ]
      : []),
    {
      icon: tools,
      label: i18next.t('procurement'),
      urls: [
        {
          label: i18next.t('procurement-schedule'),
          url: `/main-contractor/project/${slug}/procurement_schedule`,
        },
        {
          label: i18next.t('sent-tenders'),
          url: `/main-contractor/project/${slug}/issue_enquiry`,
        },
        {
          label: i18next.t('quotes-and-analysis'),
          url: `/main-contractor/project/${slug}/quotes_tender`,
        },
        ...(hasTR
          ? [
              {
                label: i18next.t('tender-recommendations'),
                url: `/main-contractor/project/${slug}/tender_recommendations`,
              },
            ]
          : []),
        {
          label: i18next.t('orders'),
          url: `/main-contractor/project/${slug}/orders`,
        },
      ],
    },
    {
      icon: projectS3,
      label: i18next.t('project-documents'),
      urls: [
        {
          label: i18next.t('file-manager'),
          url: `/main-contractor/project/${slug}/file_manager`,
        },
      ],
    },
    {
      icon: instructions,
      label: i18next.t('site-delivery'),
      urls: [
        {
          label: i18next.t('instructions-variations'),
          url: `/main-contractor/project/${slug}/instructions_variations`,
        },
        {
          icon: ncr,
          label: i18next.t('ncr'),
          url: `/main-contractor/project/${slug}/ncr`,
        },
      ],
    },
    {
      icon: forecast,
      label: i18next.t('financial-tracking'),
      urls: [
        {
          label: i18next.t('forecast-final'),
          url: `/main-contractor/project/${slug}/forecast_final`,
        },
      ],
    },
  ];
};

export default navItems;
