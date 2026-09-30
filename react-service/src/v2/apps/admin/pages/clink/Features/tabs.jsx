import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import Envelopes from './Envelopes';

const tabs = (contextType) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useTranslation();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const params = useParams();
  const id = params.accountId;

  const options = [
    {
      id: 0,
      label: t('envelopes'),
      content: <Envelopes id={id} contextType={contextType} />,
    },
  ];

  return options;
};

export default tabs;
