import React from 'react';
import styled from 'styled-components';
import { Badge, CONSTANTS, Image } from 'clink-components';
import actions from 'store/reducers/actions';
import { useTranslation } from 'react-i18next';
import HeaderLogo from './HeaderLogo';
import enquiriesActions from './actions/enquiries';
import enquiriesColumns from './columns/enquiries';
import actionColumn from './columns/actions';

const StyledMessage = styled.div`
  margin-left: 15px;
`;

const { prosperImage } = CONSTANTS.s3;
const PanelHeaderContent = ({ approved = {} }) => {
  const { t } = useTranslation();
  const color = approved.status ? 'green' : 'red';
  const text = approved.status
    ? t('approved')
    : `Not ${t('approved').toLowerCase()}`;
  return (
    <>
      <Badge text={text} color={color} />
      {!approved.status && <StyledMessage>{approved.message}</StyledMessage>}
    </>
  );
};
const prosper = {
  pages: {
    home: { path: 'dashboard', keyTitle: 'clink-home-title', home: true },
    dashboard: {
      path: 'dashboard',
      keyTitle: 'clink-dashboard-title',
    },
    opportunities: {
      path: 'projects/find-opportunities',
      keyTitle: 'clink-opportunities-title',
    },
    unlockedProjects: {
      path: 'projects/unlocked-projects',
      keyTitle: 'unlocked-projects',
    },
    registeredInterests: {
      path: 'projects/registered-interests',
      keyTitle: 'registered-interests',
    },
    enquiries: {
      actions: enquiriesActions,
      columns: enquiriesColumns,
      actionColumn: { config: actionColumn },
      path: 'enquiries',
      keyTitle: 'enquiries',
    },
    prequalification: {
      PanelHeaderContent,
    },
  },
  logo: <Image src={prosperImage} />,
  config: {
    website: 2,
    typeAccount: 3,
  },
  HeaderLogo,
  actions: actions.prosper,
  filterRoutes: [16],
};

export default prosper;
