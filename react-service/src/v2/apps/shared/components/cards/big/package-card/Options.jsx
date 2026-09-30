import React, { useState } from 'react';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import { renderHtmlInText } from 'v2/helpers/data';
import Subscription from 'v2/helpers/user/subscription';
import { Button, Image, CardLink, CONSTANTS } from 'clink-components';
import ProsperModal, { StyledModalContent } from 'v2/apps/prosper/shared/Modal';
import TokenModal from 'v2/apps/prosper/shared/TokenModal';
import {
  StyledLinkWrapper,
  StyledDaysRemaining,
  StyledDisplayer,
} from './styled';
import ButtonWrapper from 'v2/apps/prosper/shared/ButtonWrapper';

const { infoLogoRed } = CONSTANTS.s3;
const subscriptionHelper = new Subscription();

const Options = ({
  registered = false,
  canRegister = false,
  restrictedMessage,
  cardTheme = 'prosper-package-card',
  handleRegister,
  subcontractor = {},
  tenderReturn,
  claimToken = () => null,
  fetchSingleProject = null,
}) => {
  const [modal, setModal] = useState(false);
  const { t } = useTranslation();
  const { message, button } = restrictedMessage || {};
  const {
    membership,
    token_prices: tokenPrices,
    subscription_id: subscriptionId,
  } = subcontractor;
  const cannotRegisterGeneral = !registered && !canRegister;
  const hasTokens = membership && Boolean(membership.tokens);

  const daysRemaining = moment(tenderReturn).diff(new Date(), 'days') + 1;
  const daysRemainingString = t('days-remaining', { count: daysRemaining });

  const isTokenModal =
    subscriptionHelper.isTokenUser(subscriptionId) && !hasTokens;

  return (
    <StyledLinkWrapper>
      {/* if registered */}
      <StyledDisplayer show={registered}>
        <Button
          disabled={registered}
          className="package-modal submitted-button"
        >
          {t('label-interest-submitted')}
        </Button>
      </StyledDisplayer>
      {/* if not can register and register have message */}
      <TokenModal
        title="buy-more-tokens-title-2"
        tokenPrices={tokenPrices}
        externalOpen={modal}
        onHiddenModal={() => {
          if (fetchSingleProject) {
            fetchSingleProject().then(() => setModal(false));
          } else {
            setModal(false);
          }
        }}
        canClaimFreeTokens={subcontractor.canClaimFreeTokens}
        claimToken={claimToken}
        openElement={
          <StyledDisplayer show={cannotRegisterGeneral && isTokenModal}>
            <ButtonWrapper
              className="package-modal no-tokens-button"
              handleClick={() => setModal(true)}
            >
              {t('label-register-interest')}
              {daysRemaining > 0 && (
                <StyledDaysRemaining>
                  {renderHtmlInText(daysRemainingString)}
                </StyledDaysRemaining>
              )}
            </ButtonWrapper>
          </StyledDisplayer>
        }
      />
      <StyledDisplayer show={cannotRegisterGeneral && !isTokenModal}>
        <ProsperModal
          render={() => (
            <StyledModalContent className="packages-modal-content">
              <h1>
                <span>
                  <Image src={infoLogoRed} alt="Closed icon" />
                </span>
                {t('text-action-required')}
              </h1>
              <div className="package-modal-text">
                {restrictedMessage && message}
              </div>
              {restrictedMessage && message && button && (
                <div className="center">
                  <CardLink theme={cardTheme} href={button.url}>
                    {button.label || t('label-upgrade-your-account')}
                  </CardLink>
                </div>
              )}
            </StyledModalContent>
          )}
          openButton={
            <Button className="package-modal cannot-register-button">
              <div>{t('label-register-interest')}</div>
              {daysRemaining > 0 && (
                <StyledDaysRemaining>
                  {renderHtmlInText(daysRemainingString)}
                </StyledDaysRemaining>
              )}
            </Button>
          }
        />
      </StyledDisplayer>
      {/* if not can register and register dosen't have message */}
      <StyledDisplayer
        show={!cannotRegisterGeneral && !registered && canRegister}
      >
        <ButtonWrapper
          handleClick={handleRegister}
          className="package-modal can-register-button"
        >
          {t('label-register-interest')}
          {daysRemaining > 0 && (
            <StyledDaysRemaining>
              {renderHtmlInText(daysRemainingString)}
            </StyledDaysRemaining>
          )}
        </ButtonWrapper>
      </StyledDisplayer>
    </StyledLinkWrapper>
  );
};

export default Options;
