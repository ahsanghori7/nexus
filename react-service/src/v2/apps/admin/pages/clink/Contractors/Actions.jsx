import React from 'react';
import { Dropdown } from 'clink-components';
import ActionsDropdown from 'v2/apps/admin/ActionsDropdown';
import { useTranslation } from 'react-i18next';
import ConfirmModal from 'v2/apps/shared/components/confirm-modal';

const Actions = ({
  user,
  contractorsActions,
  subscriptionsList,
  handleConfirm,
}) => {
  const { t } = useTranslation();
  const actions =
    contractorsActions && contractorsActions.length ? contractorsActions : [];
  const options =
    subscriptionsList && subscriptionsList.length ? subscriptionsList : [];
  return (
    actions.length > 1 && (
      <ActionsDropdown
        content={actions.map(
          (action) =>
            action.children && (
              <Dropdown
                isFixed={false}
                key={action.id}
                align={action.align}
                openButton={action.text}
                data-testid={`contractors-actions-dropdown-${action.id}`}
                content={options.map((subscription) => (
                  <ConfirmModal
                    key={subscription.id}
                    data={subscription}
                    selected={
                      Number(subscription.id) === Number(user.subscription_id)
                    }
                    buttonLabel={`${subscription.label} / ${subscription.interval_type}`}
                    title={t('change-subscription')}
                    subtitle={t('are-you-sure')}
                    handleConfirm={handleConfirm}
                  />
                ))}
              />
            ),
        )}
      />
    )
  );
};

export default Actions;
