import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Layout } from 'clink-components';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import { getUrlWithoutParamers } from 'v2/helpers/url';
import OpportunitiesHeader from 'v2/apps/prosper/pages/projects/OpportunitiesHeader';
import HeaderContent from './header-content';
import FooterContent from './footer-content';
import useSubheader from './subheader';
import Banner from './footer-content/Banner';

function recursiveFiltering(
  routerConfig,
  subscriptionId,
  account_owner,
  countryCode
) {
  let returnRouteConfig = { ...routerConfig };
  if (routerConfig.routes) {
    returnRouteConfig = {
      ...routerConfig,
      routes: routerConfig.routes
        .map((elem) =>
          recursiveFiltering(elem, subscriptionId, account_owner, countryCode)
        )
        .filter((elem) => !!elem),
    };
  }
  if (routerConfig.filter && routerConfig.filter.includes(subscriptionId)) {
    return null;
  }
  if (
    routerConfig.filterCountry &&
    routerConfig.filterCountry.includes(countryCode)
  ) {
    return null;
  }
  if ('accountOwner' in routerConfig && !account_owner) {
    return null;
  }
  return returnRouteConfig;
}

const initialUrl = getUrlWithoutParamers();

const getTitle = (config = {}) => {
  if (config && config.type === 'component') {
    switch (config.title) {
      case 'OpportunitiesHeader':
        return <OpportunitiesHeader />;
      default:
        return '';
    }
  }
  return '';
};

const ProsperLayout = (props) => {
  const {
    routerConfig,
    subcontractor = {},
    dispatch,
    config,
    account,
    opportunities,
  } = props;
  const [url, setUrl] = useState(initialUrl);
  const location = useLocation();
  const context = useContext('prosper');
  const { actions, HeaderLogo, filterRoutes } = context;
  const {
    account_owner,
    subscription_id: subscriptionId,
    country,
  } = subcontractor;
  const { project: data } = opportunities;
  const { account: clientData } = account;

  const companyName = (clientData && clientData.name) || null;
  const projectName = (data && data.project) || null;

  const countryCode = country && country.code;
  let routerConfigFiltered = [];
  if (subscriptionId && countryCode) {
    routerConfigFiltered = routerConfig.map((elem) =>
      recursiveFiltering(
        elem,
        Number(subscriptionId),
        account_owner,
        countryCode
      )
    );
  }

  let subheaderTitle = '';
  if (config && config.type) {
    subheaderTitle = config.type === 'string' ? config.title : getTitle(config);
  }
  const pageHeader = useSubheader(
    subcontractor,
    dispatch,
    subheaderTitle,
    url,
    companyName,
    projectName,
    config.lock
  );

  useEffect(() => {
    setUrl(getUrlWithoutParamers());
  }, [location]);

  useEffect(() => {
    Promise.all([
      dispatch(actions.fetchSubcontractorInfo()),
      dispatch(actions.fetchRooms()),
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const afterBody =
    countryCode && ['UK'].includes(countryCode) ? <Banner /> : null;
  const layoutProps = {
    routerConfig: routerConfigFiltered,
    headerLogo: (
      <HeaderLogo subscriptionId={subscriptionId} filterRoutes={filterRoutes} />
    ),
    headerContent: (
      <HeaderContent
        theme="prosper"
        profileProps={subcontractor}
        claimToken={() => dispatch(actions.claimToken())}
      />
    ),
    footerContent: <FooterContent />,
    afterBody,
    pageHeader,
  };
  return (
    <Layout theme="prosper" layoutProps={layoutProps}>
      <Outlet />
    </Layout>
  );
};

const mapStateToProps = (state) => ({
  subcontractor: state.subcontractor,
  config: state.config,
  opportunities: state.opportunities,
  account: state.account,
});

export default connect(mapStateToProps)(ProsperLayout);
