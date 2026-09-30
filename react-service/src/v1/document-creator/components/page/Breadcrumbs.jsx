import React from 'react';
import { getUrl } from 'v2/helpers/url';
import GlobalBreadcrumbs from '../../../global/components/Breadcrumbs';

const listRoutes = (slug, docType) =>
  ({
    tender: {
      url: getUrl(
        'CLINK_APP_HOST',
        `/main-contractor/project/${slug}/issue_enquiry`
      ),
      breadcrumb: 'Tenders',
    },
    order: {
      url: getUrl(
        'CLINK_APP_HOST',
        `/main-contractor/project/${slug}/${
          FLAGS.DOCUSIGN ? 'orders' : 'draft_orders'
        }`
      ),
      breadcrumb: FLAGS.DOCUSIGN ? 'Orders' : 'Draft Orders',
    },
  }[docType]);

const Breadcrumbs = ({ project, docType }) => {
  const routes = [
    {
      url: getUrl('CLINK_APP_HOST', '/main-contractor'),
      breadcrumb: 'Projects',
    },
  ];

  let backRoute = {
    url: getUrl('CLINK_APP_HOST', '/main-contractor/company-assets'),
    breadcrumb: 'Company Assets',
  };

  if (project) {
    const { slug, name } = project;
    routes.push({
      url: getUrl(
        'CLINK_APP_HOST',
        `/main-contractor/project_dashboard/${slug}`
      ),
      breadcrumb: name,
    });
    backRoute = listRoutes(slug, docType);
  }

  routes.push(backRoute);

  return <GlobalBreadcrumbs routes={routes} />;
};

export default Breadcrumbs;
