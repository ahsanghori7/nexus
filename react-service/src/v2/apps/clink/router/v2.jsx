import React from 'react';
import i18next from 'v2/helpers/i18n';
import TeamManager from 'v2/apps/clink/pages/team-manager';
import InstructionsVariations from 'v2/apps/clink/pages/instructions-variations';
import NCR from 'v2/apps/clink/pages/ncr';
import BOQ from 'v2/apps/clink/pages/boq';
import TenderAnalysis from 'v2/apps/clink/pages/tender-analysis';
import ForecastFinal from 'v2/apps/clink/pages/forecast-final';
import Orders from 'v2/apps/clink/pages/orders';
import UpdateProdile from 'v2/apps/clink/pages/update-profile';
import Login from 'v2/apps/clink/pages/login';
import ResetPassword from 'v2/apps/clink/pages/login/reset-password';
import DownloadAll from 'v2/apps/clink/pages/DownloadAll';
import Projects from 'v2/apps/clink/pages/projects';
import DownloadManager from 'v2/apps/clink/pages/download-manager';
import Layout, {
  PROJECT_BREADCRUMBS,
  WITH_PROJECT,
} from 'v2/apps/clink/layout';
import instructionsFormRoute from './InstructionsWrapper';
import supplyChainProfileRoute from './SPWrapper';
import ProjectDashboardTabs from 'v2/apps/clink/pages/project-dashboard/project-dashboard-tabs';
import SosLogin from 'v2/apps/clink/pages/sos-login';
import TenderRecommendations from 'v2/apps/clink/pages/tender-recommendations';
import TenderRecommendationForm from 'v2/apps/clink/pages/tender-recommendations/form/index';
import flag from 'helpers/flags';

const routerConfig = [
  {
    path: '/login',
    reactRouter: true,
    routes: [
      {
        path: '',
        element: <Login />,
      },
    ],
  },
  {
    path: '/auth',
    reactRouter: true,
    routes: [
      {
        path: '',
        element: <SosLogin />,
      },
    ],
  },
  {
    path: '/reset-password',
    reactRouter: true,
    routes: [
      {
        path: '',
        element: <ResetPassword />,
      },
    ],
  },
  {
    path: `${BASE_URLS.CLINK}`,
    reactRouter: true,
    routes: [
      {
        path: '',
        element: (
          <Layout>
            <Projects />
          </Layout>
        ),
      },
      {
        path: 'add_team',
        element: (
          <Layout title={i18next.t('team-manager')}>
            <TeamManager />
          </Layout>
        ),
      },
      {
        path: 'profile',
        element: (
          <Layout>
            <UpdateProdile />
          </Layout>
        ),
      },
      {
        path: 'project_dashboard/:slug',
        element: (
          <Layout breadCrumbItems={[...PROJECT_BREADCRUMBS]} projectName>
            <ProjectDashboardTabs />
          </Layout>
        ),
      },
      {
        path: 'project/:slug/instructions_variations',
        element: (
          <Layout
            breadCrumbItems={[
              ...PROJECT_BREADCRUMBS,
              {
                ...WITH_PROJECT,
                rest: 'instructions_variations',
                name: i18next.t('instructions-variations'),
              },
            ]}
            title={i18next.t('instructions-variations')}
          >
            <InstructionsVariations />
          </Layout>
        ),
      },
      {
        path: 'project/:slug/ncr',
        element: (
          <Layout
            breadCrumbItems={[
              ...PROJECT_BREADCRUMBS,
              {
                ...WITH_PROJECT,
                rest: 'ncr',
                name: i18next.t('ncr'),
              },
            ]}
            title={i18next.t('ncr')}
          >
            <NCR />
          </Layout>
        ),
      },
      {
        path: 'project/:slug/forecast_final',
        element: (
          <Layout
            breadCrumbItems={[...PROJECT_BREADCRUMBS]}
            title={i18next.t('forecast-finals')}
          >
            <ForecastFinal />
          </Layout>
        ),
      },
      ...(flag('TENDER_RECOMMENDATION')
        ? [
          {
            path: 'project/:slug/tender_recommendations',
            element: (
              <Layout
                breadCrumbItems={[
                  ...PROJECT_BREADCRUMBS,
                  {
                    ...WITH_PROJECT,
                    rest: 'tender_recommendations',
                    name: i18next.t('tender-recommendations'),
                  },
                ]}
                title={i18next.t('tender-recommendations')}
              >
                <TenderRecommendations />
              </Layout>
            ),
          },
          {
            path: 'project/:slug/tender_recommendation/:packageId/:recommendationId',
            element: (
              <Layout
                breadCrumbItems={[
                  ...PROJECT_BREADCRUMBS,
                  {
                    ...WITH_PROJECT,
                    rest: 'tender_recommendations',
                    name: i18next.t('tender-recommendations'),
                  },
                ]}
              >
                <TenderRecommendationForm />
              </Layout>
            ),
          },
        ]
        : []),
      instructionsFormRoute,
      {
        path: 'project/:slug/orders',
        element: (
          <Layout
            breadCrumbItems={[...PROJECT_BREADCRUMBS]}
            title={i18next.t('orders')}
          >
            <Orders />
          </Layout>
        ),
      },
      supplyChainProfileRoute,
      {
        path: 'project/:slug/boq',
        element: (
          <Layout
            title={i18next.t('boq')}
            breadCrumbItems={[
              ...PROJECT_BREADCRUMBS,
              {
                ...WITH_PROJECT,
                rest: 'procurement_schedule',
                name: i18next.t('procurement-schedule'),
                label: i18next.t('procurement-schedule'),
              },
              {
                ...WITH_PROJECT,
                rest: 'boq',
                name: i18next.t('boq'),
                label: i18next.t('boq'),
              },
            ]}
          >
            <BOQ />
          </Layout>
        ),
      },
      {
        path: 'project/:slug/boq/:tid',
        element: (
          <Layout
            title={i18next.t('boq')}
            breadCrumbItems={[
              ...PROJECT_BREADCRUMBS,
              {
                ...WITH_PROJECT,
                rest: 'procurement_schedule',
                name: i18next.t('procurement-schedule'),
                label: i18next.t('procurement-schedule'),
              },
              {
                ...WITH_PROJECT,
                rest: 'boq',
                name: i18next.t('boq'),
                label: i18next.t('boq'),
              },
            ]}
          >
            <BOQ />
          </Layout>
        ),
      },
      {
        path: 'project/:slug/boq/:tid/tender_analysis',
        element: (
          <Layout
            breadCrumbItems={[
              ...PROJECT_BREADCRUMBS,
              {
                ...WITH_PROJECT,
                rest: 'quotes_tender',
                name: i18next.t('quotes-tender-analysis'),
                label: i18next.t('quotes-tender-analysis'),
              },
              {
                name: i18next.t('ta-quotes-comparison'),
                label: i18next.t('ta-quotes-comparison'),
              },
            ]}
          >
            <TenderAnalysis />
          </Layout>
        ),
      },
      {
        path: 'project/:slug/boq/:tid/tender_analysis/summary',
        element: (
          <Layout
            breadCrumbItems={[
              ...PROJECT_BREADCRUMBS,
              {
                ...WITH_PROJECT,
                rest: 'quotes_tender',
                name: i18next.t('quotes-tender-analysis'),
                label: i18next.t('quotes-tender-analysis'),
              },
              {
                name: i18next.t('ta-quotes-comparison'),
                label: i18next.t('ta-quotes-comparison'),
              },
            ]}
          >
            <TenderAnalysis />
          </Layout>
        ),
      },
      {
        path: 'project/:slug/boq/:tid/quote/:quote_id',
        element: (
          <Layout
            breadCrumbItems={[
              ...PROJECT_BREADCRUMBS,
              {
                ...WITH_PROJECT,
                rest: 'quotes_tender',
                name: i18next.t('quotes-tender-analysis'),
                label: i18next.t('quotes-tender-analysis'),
              },
              {
                name: i18next.t('ta-quotes-comparison'),
                label: i18next.t('ta-quotes-comparison'),
              },
            ]}
          >
            <TenderAnalysis />
          </Layout>
        ),
      },
    ],
  },
  {
    path: '/download-all/tender/categories/:rest',
    reactRouter: true,
    routes: [
      {
        path: '',
        element: <DownloadAll />,
      },
    ],
  },
  {
    path: '/download-manager/:context/:documentId',
    reactRouter: true,
    routes: [
      {
        path: '',
        element: <DownloadManager />,
      },
    ],
  },
  {
    path: '/download-manager/:context/:documentId/:token',
    reactRouter: true,
    routes: [
      {
        path: '',
        element: <DownloadManager />,
      },
    ],
  },
];

export default routerConfig;
