import React from 'react';
import i18next from 'v2/helpers/i18n';
import { getUrl } from 'v2/helpers/url';
import Layout from 'v2/apps/clink/layout';
import CompanyAssets from 'v1/company-assets/components/Page';
import Templates from 'v1/company-assets/components/Templates';
import Packages from 'v1/company-assets/components/Packages';
import ScopeOfWorksForm from 'v1/company-assets/components/ScopeOfWorks/Form';
import { clinkAccountInitialState } from 'v2/store/reducers/clink/account';

const companyAssetsBaseUrl = getUrl(
  'CLINK_APP_HOST',
  `${BASE_URLS.COMPANY_ASSETS}`
);

const buildCompanyAssetsRoutes = (clinkAccount = clinkAccountInitialState) => {
  const canAccessCompanyAssets =
    clinkAccount?.acl?.companyAssets?.canAccess ?? true;

  if (!canAccessCompanyAssets) {
    return [];
  }

  return [
    {
      path: '/company-assets',
      element: (
        <Layout title={i18next.t('company-assets')}>
          <CompanyAssets />
        </Layout>
      ),
    },
    {
      path: '/company-assets/order-templates',
      element: (
        <Layout
          title={i18next.t('order-templates')}
          breadCrumbItems={[
            {
              label: i18next.t('company-assets'),
              name: i18next.t('company-assets'),
              href: '/main-contractor/company-assets',
            },
          ]}
        >
          <Templates typeAsset="orders" tenderTemplate="Order Templates" />
        </Layout>
      ),
    },
    {
      path: '/company-assets/letter-of-intent',
      element: (
        <Layout
          title={i18next.t('letter-of-intent')}
          breadCrumbItems={[
            {
              label: i18next.t('company-assets'),
              name: i18next.t('company-assets'),
              href: '/main-contractor/company-assets',
            },
          ]}
        >
          <Templates typeAsset="letters" tenderTemplate={i18next.t('letter-of-intent')} />
        </Layout>
      ),
    },
    {
      path: '/company-assets/pre-order',
      element: (
        <Layout
          title={i18next.t('pre-order')}
          breadCrumbItems={[
            {
              label: i18next.t('company-assets'),
              name: i18next.t('company-assets'),
              href: '/main-contractor/company-assets',
            },
          ]}
        >
          <Templates typeAsset="preorder" tenderTemplate={i18next.t('pre-order')} />
        </Layout>
      ),
    },
    {
      path: '/company-assets/tender-templates',
      element: (
        <Layout
          title={i18next.t('tender-templates')}
          breadCrumbItems={[
            {
              label: i18next.t('company-assets'),
              name: i18next.t('company-assets'),
              href: '/main-contractor/company-assets',
            },
          ]}
        >
          <Templates typeAsset="tenders" tenderTemplate="Tender Templates" />
        </Layout>
      ),
    },
    {
      path: '/company-assets/schedule-of-attendances',
      element: (
        <Layout
          title={i18next.t('schedule-attendances')}
          breadCrumbItems={[
            {
              label: i18next.t('company-assets'),
              name: i18next.t('company-assets'),
              href: '/main-contractor/company-assets',
            },
          ]}
        >
          <Packages
            title="Schedule of attendances"
            subtitle="Select a Schedule of attendances template to view"
            helpText="Here you can view, edit, and create schedule of attendances templates."
            type="soa"
            editUrl={`${companyAssetsBaseUrl}/schedule-of-attendances`}
          />
        </Layout>
      ),
    },
    {
      path: '/company-assets/scope-of-works',
      element: (
        <Layout
          title={i18next.t('scope-of-works')}
          breadCrumbItems={[
            {
              label: i18next.t('company-assets'),
              name: i18next.t('company-assets'),
              href: '/main-contractor/company-assets',
            },
          ]}
        >
          <Packages
            title="Scope of Works"
            subtitle="Select a Scope of Works template to view"
            helpText="Here you can view, edit, and create scope of works templates."
            type="sow"
            editUrl={`${companyAssetsBaseUrl}/scope-of-works`}
          />
        </Layout>
      ),
    },
    {
      path: '/company-assets/scope-of-works/:templateId',
      element: (
        <Layout
          breadCrumbItems={[
            {
              label: i18next.t('company-assets'),
              name: i18next.t('company-assets'),
              href: '/main-contractor/company-assets',
            },
            {
              label: i18next.t('scope-of-works'),
              name: i18next.t('scope-of-works'),
              href: '/main-contractor/company-assets/scope-of-works',
            },
          ]}
        >
          <ScopeOfWorksForm />
        </Layout>
      ),
    },
  ];
};

const routerConfig = buildCompanyAssetsRoutes();

export { buildCompanyAssetsRoutes };
export default routerConfig;
