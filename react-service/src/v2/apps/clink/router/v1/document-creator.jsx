import React from 'react';
import i18next from 'v2/helpers/i18n';
import Layout, {
  PROJECT_BREADCRUMBS,
  WITH_PROJECT,
} from 'v2/apps/clink/layout';
import Template from 'v1/document-creator/components/template';

const showForm = true;
const tenderType = 'tender';
const orderType = 'order';

const routerConfig = {
  path: BASE_URLS.DOCUMENT_CREATOR,
  reactRouter: true,
  routes: [
    {
      path: '/template/:templateId/tender/:tenderId',
      element: (
        <Layout
          breadCrumbItems={[
            ...PROJECT_BREADCRUMBS,
            {
              ...WITH_PROJECT,
              rest: 'issue_enquiry',
              name: i18next.t('tender-templates'),
            },
          ]}
          title={i18next.t('document-creator')}
        >
          <Template docType={tenderType} showForm={showForm} />
        </Layout>
      ),
    },
    {
      path: '/template/:templateId/order/:tenderId',
      element: (
        <Layout
          breadCrumbItems={[
            ...PROJECT_BREADCRUMBS,
            {
              ...WITH_PROJECT,
              rest: 'orders',
              name: i18next.t('orders'),
            },
          ]}
          title={i18next.t('document-creator')}
        >
          <Template docType={orderType} showForm={showForm} />
        </Layout>
      ),
    },
    {
      path: '/template/:templateId',
      element: (
        <Layout
          breadCrumbItems={[
            {
              label: i18next.t('company-assets'),
              name: i18next.t('company-assets'),
              href: '/main-contractor/company-assets',
            },
            {
              label: i18next.t('tender-templates'),
              name: i18next.t('tender-templates'),
              href: '/main-contractor/company-assets/tender-templates',
            },
          ]}
          title={i18next.t('document-creator')}
        >
          <Template />
        </Layout>
      ),
    },
  ],
};

export default routerConfig;
