import React from 'react';
import { Status } from 'clink-components';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { getQueryStringVars } from 'v2/helpers/url';
import { useContext } from 'v2/hooks/context';
import { EXTERNAL_SUBCONTRACTOR } from 'apps/admin/router';
import Contractors from 'v2/apps/admin/pages/clink/Contractors';
import Projects from 'v2/apps/admin/pages/clink/Projects';
import Accounts from 'v2/apps/admin/pages/clink/Accounts';
import AccountsProsper from 'v2/apps/admin/pages/prosper/Accounts';

const AccountsProsperSupplyChain = (params) => (
  <AccountsProsper customTypeAccount={EXTERNAL_SUBCONTRACTOR} {...params} />
);

const mapModelToPage = (model) => {
  switch (model) {
    case 'projects':
      return Projects;
    case 'users':
      return Contractors;
    case 'accounts':
      return Accounts;
    case 'accountsProsper':
      return AccountsProsper;
    case 'accountsProsperSupplyChain':
      return AccountsProsperSupplyChain;
    default:
      return null;
  }
};

const SearchResults = (props) => {
  const { contextType = 'admin' } = props;
  const { model, ...params } = getQueryStringVars();

  const { t } = useTranslation();

  const context = useContext(contextType);
  const { pages } = context;
  const { search: searchPage } = pages;
  const { acceptedModels } = searchPage;

  const errors = {
    noModel: !model,
    invalidModel: !acceptedModels.includes(model),
  };

  const Page = mapModelToPage(model);

  return (
    <>
      {errors.noModel && (
        <Status severity="warning" message={t('error-no-model')} />
      )}
      {!errors.noModel && errors.invalidModel && (
        <Status
          severity="warning"
          message={`${t('error-no-available-model')} ${model}`}
        />
      )}
      {!errors.noModel && !errors.invalidModel && Page && (
        <Page params={params} />
      )}
    </>
  );
};

const mapStateToProps = (state) => ({
  admin: state.admin,
  users: state.users,
  projects: state.projects,
});

export default connect(mapStateToProps)(SearchResults);
