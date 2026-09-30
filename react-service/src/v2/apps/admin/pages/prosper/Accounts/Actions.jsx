import React from 'react';
import { Dropdown } from 'clink-components';
import { useTranslation } from 'react-i18next';
import ActionsDropdown from 'v2/apps/admin/ActionsDropdown';
import ChangeSubscriptionModal from './change-subscription-modal';

const Actions = ({
  user,
  accountsActions,
  subscriptionsList,
  handleConfirm,
  regionOptions,
}) => {
  const { t } = useTranslation();
  const actions =
    accountsActions && accountsActions.length ? accountsActions : [];
  const options =
    subscriptionsList && subscriptionsList.length ? subscriptionsList : [];
  return (
    <ActionsDropdown
      className="prosper-accounts-actions"
      content={actions.map(
        (action) =>
          action.children && (
            <Dropdown
              isFixed={false}
              key={action.id}
              align={action.align}
              openButton={action.text}
              data-testid={`prosper-accounts-actions-dropdown-${action.id}`}
              content={options.map((subscription) => (
                <ChangeSubscriptionModal
                  key={subscription.id}
                  subscription={subscription}
                  user={user}
                  buttonLabel={`${subscription.label} / ${subscription.interval_type}`}
                  title={t('change-subscription')}
                  handleConfirm={handleConfirm}
                  options={regionOptions}
                />
              ))}
            />
          )
      )}
    />
  );
};

export default Actions;
