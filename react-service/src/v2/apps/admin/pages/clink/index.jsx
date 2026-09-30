import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Breadcrumbs, Page, Searchbox } from 'clink-components';
import { connect } from 'react-redux';
import i18next from 'v2/helpers/i18n';
import { useContext } from 'hooks/context';
import {
  createBreadcrumbs,
  getQueryStringVars,
  goToSearch,
} from 'v2/helpers/url';
import FormModal from './modal';
import DefaultRightContent from './DefaultRightContent';
import SelectDataToShow from './SelectDataToShow';

const getSubRightContent = (model, mainContractors, aid) => {
  let content = null;
  switch (model) {
    case 'customerHealthScore': {
      content = <SelectDataToShow model={model} />;
      break;
    }
    case 'features': {
      content = aid ? null : <SelectDataToShow model={model} />;
      break;
    }
    case 'accounts':
      content = null;
      break;
    case 'users':
      content = (
        <DefaultRightContent options={mainContractors}>
          <FormModal />
        </DefaultRightContent>
      );
      break;
    default:
      content = <DefaultRightContent options={mainContractors} />;
      break;
  }
  return content;
};

const getPlaceholder = (model) => {
  switch (model) {
    case 'projects':
      return i18next.t('search-project');
    case 'users':
      return i18next.t('search-contractor');
    case 'accounts':
      return i18next.t('search-account');
    default:
      return null;
  }
};

function AdminCLink(props) {
  const { model: searchModel, term } = getQueryStringVars();
  const {
    contextType = 'admin',
    admin,
    dispatch,
    model,
    [model || searchModel]: stateModel = { status: null },
    children,
  } = props;

  const params = useParams();
  const aid = params.accountId;

  const { mainContractors } = admin;
  const context = useContext(contextType);
  const { actions, logo, pages, config } = context;
  const { website } = config;
  const { home, dashboard, [model || searchModel]: modelPage, search } = pages;
  const { status } = stateModel;

  useEffect(() => {
    if (!model || (model && model !== 'features')) {
      dispatch(actions.fetchSubscriptions({ website }));
    }
    if (
      !model ||
      (model &&
        model !== 'accounts' &&
        model !== 'customerHealthScore' &&
        model !== 'features')
    ) {
      dispatch(actions.fetchMainContractors());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let breadcrumbsPages = [home, dashboard];
  breadcrumbsPages = modelPage ? [home, modelPage] : breadcrumbsPages;
  breadcrumbsPages = searchModel ? [home, modelPage, search] : breadcrumbsPages;
  const breadcrumbs = createBreadcrumbs('', breadcrumbsPages);
  const searchbox = {
    name: 'search',
    defaultValue: term || '',
    placeholder: getPlaceholder(model || searchModel),
    onSubmit: (event) =>
      goToSearch('', model || searchModel, {
        term: event.search.trim(),
      }),
  };
  const subLeftContent = <Breadcrumbs {...breadcrumbs} />;
  const mainMiddleContent =
    (model && model !== 'customerHealthScore' && model !== 'features') ||
    searchModel ? (
      <div data-testid="clink-searchbox">
        <Searchbox {...searchbox} />
      </div>
    ) : null;
  const options = mainContractors
    ? mainContractors.map((option) => ({
        id: option.id,
        content: option.name,
      }))
    : [];
  const subRightContent = getSubRightContent(
    model || searchModel,
    options,
    aid,
  );

  let titlePage = i18next.t(dashboard.keyTitle);
  titlePage = modelPage ? i18next.t(modelPage.keyTitle) : titlePage;
  titlePage = searchModel ? i18next.t('search-title') : titlePage;

  return (
    <Page
      pageHeader={{
        title: titlePage,
        logo,
        subLeftContent,
        subRightContent,
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
  projects: state.projects,
  accounts: state.accounts,
  subscription: state.subscription,
  customerHealthScore: state.customerHealthScore,
  features: state.features,
});

export default connect(mapStateToProps)(AdminCLink);
