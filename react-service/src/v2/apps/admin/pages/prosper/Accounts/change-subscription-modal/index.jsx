import React from 'react';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Button, Modal, ModalContent } from 'clink-components';
import i18next from 'v2/helpers/i18n';
import ConfirmModal from 'v2/apps/shared/components/confirm-modal';
import {
  MuiChangeSubscriptionsModal,
  MuiTitleWrapper,
  MuiTitle,
  MuiSmall,
} from './Mui.styled';
import Regional from './Regional';
import Flexi from './Flexi';

const ID_FLEXI_SUBSCRIPTION = 11;
const ID_REGIONAL_SUBSCRIPTION = 12;

const ChangeSubscriptionModal = ({
  subscription,
  user,
  title = '',
  buttonLabel = '',
  handleConfirm,
  options,
}) => {
  const { t } = useTranslation();
  const { id } = subscription;

  const getContent = (modalProps) => {
    if (Number(id) === ID_FLEXI_SUBSCRIPTION) {
      const subtitle = i18next.t('add-tokens');
      return {
        subtitle,
        content: (
          <Flexi
            placeholder={subtitle}
            subscription={subscription}
            modalProps={modalProps}
            handleConfirm={handleConfirm}
          />
        ),
      };
    }
    if (Number(id) === ID_REGIONAL_SUBSCRIPTION) {
      const subtitle = i18next.t('select-region');
      return {
        subtitle,
        content: (
          <Regional
            placeholder={subtitle}
            subscription={subscription}
            options={options ?? []}
            modalProps={modalProps}
            handleConfirm={handleConfirm}
          />
        ),
      };
    }
    return { subtitle: '', content: null };
  };
  const isConfirmModal =
    Number(id) !== ID_FLEXI_SUBSCRIPTION &&
    Number(id) !== ID_REGIONAL_SUBSCRIPTION;
  return isConfirmModal ? (
    <ConfirmModal
      key={id}
      data={subscription}
      selected={Number(subscription.id) === Number(user.subscription_id)}
      buttonLabel={`${subscription.label} / ${subscription.interval_type}`}
      title={t('change-subscription')}
      subtitle={t('are-you-sure')}
      handleConfirm={handleConfirm}
    />
  ) : (
    <Modal
      openElement={
        <Button layout="dropdown" align="right" data-testid="change-subscription-button-open">
          {buttonLabel}
        </Button>
      }
      className="change-subscription-modal"
      render={(modalProps) => {
        const { content, subtitle } = getContent(modalProps);
        return (
          <ModalContent>
            <MuiChangeSubscriptionsModal>
              <MuiTitleWrapper>
                <MuiTitle>{title}</MuiTitle>
                <MuiSmall>{subtitle}</MuiSmall>
              </MuiTitleWrapper>
              {content}
            </MuiChangeSubscriptionsModal>
          </ModalContent>
        );
      }}
    />
  );
};

const mapStateToProps = (state) => ({
  users: state.users,
  filters: state.filters,
});

export default connect(mapStateToProps)(ChangeSubscriptionModal);
