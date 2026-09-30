import React from 'react';
import { CONSTANTS } from 'clink-components';
import ActionsDropdown from 'v2/apps/admin/ActionsDropdown';
import i18next from 'v2/helpers/i18n';
import FormModal from './form';

const { rocketLogo } = CONSTANTS.s3;

const actionsConfig = [{ id: 1, text: i18next.t('create-account') }];
const Index = () => {
  return (
    <ActionsDropdown
      content={actionsConfig.map((action) => (
        <FormModal key={action.id} />
      ))}
      downIcon={rocketLogo}
      upIcon={rocketLogo}
    />
  );
};

function ActionModal() {
  return <Index />;
}

export default ActionModal;
