import React from 'react';
import { Breadcrumbs, Page, Searchbox } from 'clink-components';
import { connect } from 'react-redux';
import i18next from 'v2/helpers/i18n';
import { useContext } from 'hooks/context';
import {
  createBreadcrumbs,
  getQueryStringVars,
  goToSearch,
} from 'v2/helpers/url';

const getPlaceholder = (model) => {
  switch (model) {
    case 'accountsProsper':
    case 'accountsProsperSupplyChain':
      return i18next.t('search-account');
    default:
      return null;
  }
};

function AdminProsper(props) {
  const { model: searchModel, term } = getQueryStringVars();
  const {
    contextType = 'adminProsper',
    model,
    [model || searchModel]: stateModel = { status: null },
    children,
  } = props;
  const context = useContext(contextType);
  const { logo, pages } = context;
  const { home, dashboard, [model || searchModel]: modelPage, search } = pages;
  const { status } = stateModel;

  let breadcrumbsPages = [home, dashboard];
  breadcrumbsPages = modelPage ? [home, modelPage] : breadcrumbsPages;
  breadcrumbsPages = searchModel ? [home, modelPage, search] : breadcrumbsPages;
  const breadcrumbs = createBreadcrumbs(
    `${BASE_URLS.ADMIN_PROSPER}`,
    breadcrumbsPages,
  );
  const searchbox = {
    name: 'search',
    defaultValue: term || '',
    placeholder: getPlaceholder(model || searchModel),
    onSubmit: (event) =>
      goToSearch(BASE_URLS.ADMIN_PROSPER, model || searchModel, {
        term: event.search.trim(),
      }),
  };
  const subLeftContent = <Breadcrumbs {...breadcrumbs} />;
  const mainMiddleContent =
    model || searchModel ? (
      <div data-testid="prosper-searchbox">
        <Searchbox {...searchbox} />
      </div>
    ) : null;
  let titlePage = i18next.t(dashboard.keyTitle);
  titlePage = modelPage ? i18next.t(modelPage.keyTitle) : titlePage;
  titlePage = searchModel ? i18next.t('search-title') : titlePage;

  return (
    <Page
      pageHeader={{
        title: titlePage,
        logo,
        subLeftContent,
        mainMiddleContent,
      }}
      status={status}
    >
      {children}
    </Page>
  );
}

const mapStateToProps = (state) => ({
  admin: state.admin,
  users: state.users,
});

export default connect(mapStateToProps)(AdminProsper);
