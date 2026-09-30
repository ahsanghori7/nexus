import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import Prequalification from './prequalification';
import CompanyProfile from './company';
import DataTable from 'v2/apps/admin/DataTable';

const tabs = (contextType, uid) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useTranslation();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const params = useParams();
  const id = params.accountId;

  const options = [
    {
      id: 0,
      label: t('profile-information'),
      content: <CompanyProfile id={id} contextType={contextType} />,
    },
    {
      id: 1,
      label: t('prequalification-information'),
      content: <Prequalification contextType={contextType} />,
    },
    {
      id: 2,
      label: t('activity'),
      content: (
        <DataTable id={id} contextType={contextType} dataType="activity" />
      ),
    },
    {
      id: 3,
      label: t('clink-opportunities-title'),
      content: (
        <DataTable id={id} contextType={contextType} dataType="opportunities" />
      ),
    },
    {
      id: 4,
      label: t('engagement'),
      content: (
        <DataTable
          id={uid}
          contextType={contextType}
          dataType="engagement"
          table="user"
        />
      ),
    },
  ];

  options.push({
    id: 5,
    label: t('clink-supply-chain-title'),
    content: (
      <DataTable id={id} contextType={contextType} dataType="supply_chain" />
    ),
  });

  return options;
};

export default tabs;
