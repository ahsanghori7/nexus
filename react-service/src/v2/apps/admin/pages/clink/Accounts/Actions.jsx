import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Dropdown } from 'clink-components';
import ActionsDropdown from 'v2/apps/admin/ActionsDropdown';
import ConfirmModal from 'v2/apps/shared/components/confirm-modal';
import AddToSupplyChainModal from 'v2/apps/shared/components/add-to-supply-chain-modal';
import { getUrl, goTo } from 'v2/helpers/url';


const ContentWithoutChildren = ({
  action,
  account,
  toggleStatus,
  updateFirstPQQSentProperty,
  trades,
  locations,
  dispatch,
  actions,
}) => {
  const { t } = useTranslation();
  if (!action) {
    return null;
  }
  switch (action.id) {
    case 2:
      return (
        <ConfirmModal
          key={account.id}
          data={account}
          buttonLabel={t('enable-disable')}
          title={t('enable-disable')}
          subtitle={t('are-you-sure')}
          handleConfirm={toggleStatus}
          customOpenElement={
            <Button
              handleClick={() => {}}
              key={action.id}
              layout="dropdown"
              align="left"
              data-testid="clink-accounts-button-enable-disable"
            >
              {action.text}
            </Button>
          }
        />
      );
    case 3:
      return (
        <Button
          handleClick={() => {
            if (action.text === t('view-account-details')) {
              goTo(`${getUrl('admin', `accounts/${account.id}`)}`);
            }
          }}
          key={action.id}
          layout="dropdown"
          align="left"
          data-testid="clink-accounts-button-view-account"
        >
          {action.text}
        </Button>
      );
    case 4:
      return (
        <ConfirmModal
          key={account.id}
          data={account}
          buttonLabel={t('changing-exemption-pqq')}
          title={t('changing-exemption-pqq')}
          subtitle={t('are-you-sure')}
          handleConfirm={updateFirstPQQSentProperty}
          customOpenElement={
            <Button
              handleClick={() => {}}
              key={action.id}
              layout="dropdown"
              align="left"
              data-testid="clink-accounts-button-pqq-exemption"
            >
              {action.text}
            </Button>
          }
        />
      );
    case 5:
      return (
        <AddToSupplyChainModal
          key={action.id}
          account={account}
          trades={trades || []}
          locations={locations || []}
          dispatch={dispatch}
          actions={actions}
          customOpenElement={
            <Button
              handleClick={() => {}}
              key={action.id}
              layout="dropdown"
              align="left"
              data-testid="clink-accounts-button-add-supply-chain"
            >
              {action.text}
            </Button>
          }
        />
      );
    default:
      return null;
  }
};

const Actions = ({
  account,
  accountsActions,
  subscriptionsList,
  changeSubscription,
  toggleStatus,
  updateFirstPQQSentProperty,
  trades,
  locations,
  dispatch,
  actions,
}) => {
  const { t } = useTranslation();
   actions =
    accountsActions && accountsActions.length ? accountsActions : [];
  const options =
    subscriptionsList && subscriptionsList.length ? subscriptionsList : [];



  return (
    <ActionsDropdown
      content={actions.map((action) =>
        action.children ? (
          <Dropdown
            isFixed={false}
            key={action.id}
            align={action.align}
            openButton={action.text}
            content={options.map((subscription) => (
              <ConfirmModal
                key={subscription.id}
                data={subscription}
                selected={
                  Number(subscription.id) === Number(account.subscription_id)
                }
                buttonLabel={`${subscription.label} / ${subscription.interval_type}`}
                title={t('change-subscription')}
                subtitle={t('are-you-sure')}
                handleConfirm={changeSubscription}
              />
            ))}
          />
        ) : (
          <ContentWithoutChildren
            account={account}
            key={action.id}
            action={action}
            toggleStatus={toggleStatus}
            updateFirstPQQSentProperty={updateFirstPQQSentProperty}
            trades={trades}
            locations={locations}
            dispatch={dispatch}
            actions={actions}
          />
        ),
      )}
    />
  );
};

export default Actions;
