import React from 'react';
import flag from 'v2/helpers/flags';
import i18next from 'v2/helpers/i18n';
import Layout, { PROJECT_BREADCRUMBS } from 'v2/apps/clink/layout';
import { buildCompanyAssetsRoutes } from './company-assets';
import SupplyChain from 'v1/supply-chain-v2/components/page';
import TenderTemplates from 'v2/apps/clink/pages/tender-templates';
import TenderTemplatesOld from 'v1/tender-templates/components/Page';
import FileManager from 'v1/file-manager/components/page';
import ProcurementSchedule from 'v1/procurement-schedule/components/page';
import EnquiriesIssued from 'v2/apps/clink/pages/transactions';
import QuotesAndTender from 'v1/quotes-tender/components/page';
import DocumentCreator from './document-creator';
import PMP from 'v2/apps/clink/pages/pmp';
import { clinkAccountInitialState } from 'v2/store/reducers/clink/account';

const TenderTemplatesComponent = flag('NEW_TENDER_TEMPLATES')
  ? TenderTemplates
  : TenderTemplatesOld;

const buildRouterConfig = (clinkAccount = clinkAccountInitialState) => {
  const projectListAcl = clinkAccount?.acl?.projectList || {};
  const isEditable = projectListAcl.canEdit ?? true;
  const companyAssetsRoutes = buildCompanyAssetsRoutes(clinkAccount);

  return [
    {
      path: `${BASE_URLS.PROJECTS}`,
      reactRouter: true,
      routes: [
        // SupplyChain
        {
          path: 'supply_chain',
          element: (
            <Layout title={i18next.t('supply-chain')}>
              <SupplyChain />
            </Layout>
          ),
        },
        // P&S
        {
          path: 'project/:slug/procurement_schedule',
          element: (
            <Layout
              breadCrumbItems={[...PROJECT_BREADCRUMBS]}
              title={i18next.t('procurement-schedule')}
            >
              <ProcurementSchedule />
            </Layout>
          ),
        },
        // Company Assets
        ...companyAssetsRoutes,
        // File Manager
        {
          path: '/project/:slug/file_manager',
          element: (
            <Layout
              breadCrumbItems={[...PROJECT_BREADCRUMBS]}
              state={1}
              isFileManager={1}
              title={i18next.t('file-manager')}
            >
              <FileManager />
            </Layout>
          ),
        },
        {
          path: '/project/:slug/file_manager/:folder',
          element: (
            <Layout
              breadCrumbItems={[...PROJECT_BREADCRUMBS]}
              title={i18next.t('file-manager')}
            >
              <FileManager />
            </Layout>
          ),
        },
        // Enquiries Issued
        {
          path: '/project/:slug/issue_enquiry',
          element: (
            <Layout
              breadCrumbItems={[...PROJECT_BREADCRUMBS]}
              title={i18next.t('sent-tenders')}
            >
              <EnquiriesIssued title={i18next.t('sent-tenders')} />
            </Layout>
          ),
        },
        // Quotes and Tender
        {
          path: '/project/:slug/quotes_tender',
          element: (
            <Layout
              breadCrumbItems={[...PROJECT_BREADCRUMBS]}
              title={i18next.t('quotes-tender-analysis')}
            >
              <QuotesAndTender />
            </Layout>
          ),
        },
        // Project Setup (PMP)
        ...(isEditable
          ? [
              {
                path: '/projects/:slug/setup',
                element: (
                  <Layout
                    breadCrumbItems={[...PROJECT_BREADCRUMBS]}
                    title="Edit Project Profile"
                  >
                    <PMP activeStep={0} />
                  </Layout>
                ),
              },
              {
                path: '/projects/:slug/setup/project_team',
                element: (
                  <Layout
                    breadCrumbItems={[...PROJECT_BREADCRUMBS]}
                    title="Edit Project Profile"
                  >
                    <PMP activeStep={1} />
                  </Layout>
                ),
              },
              {
                path: '/projects/:slug/setup/scope_details',
                element: (
                  <Layout
                    breadCrumbItems={[...PROJECT_BREADCRUMBS]}
                    title="Edit Project Profile"
                  >
                    <PMP activeStep={2} />
                  </Layout>
                ),
              },
              {
                path: '/projects/:slug/setup/reference_files',
                element: (
                  <Layout
                    breadCrumbItems={[...PROJECT_BREADCRUMBS]}
                    title="Edit Project Profile"
                  >
                    <PMP activeStep={3} />
                  </Layout>
                ),
              },
              {
                path: '/projects/:slug/setup/work_packages',
                element: (
                  <Layout
                    breadCrumbItems={[...PROJECT_BREADCRUMBS]}
                    title="Edit Project Profile"
                  >
                    <PMP activeStep={4} />
                  </Layout>
                ),
              },
            ]
          : []),
        // Legacy URLs
        {
          path: '/cost-planning-tool',
          element: <Layout noReact />,
        },
      ],
    },
    // Document Creator
    DocumentCreator,
  ];
};

const routerConfig = buildRouterConfig();

export { buildRouterConfig };
export default routerConfig;
