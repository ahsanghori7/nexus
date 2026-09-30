import React, { useState } from 'react';
import { Dropdown, Image, CONSTANTS } from 'clink-components';
import { useTranslation } from 'react-i18next';
import { isIOS, isIpadOS } from 'v2/helpers/window';
import Subscription from 'v2/helpers/user/subscription';
import TokenModal from 'v2/apps/prosper/shared/TokenModal';
import Box from '@mui/material/Box';
import OpenDropdown from './OpenDropdown';
import {
  StyledContainer,
  StyledNotifications,
  StyledSeparator,
  StyledTokenSM,
  StyledTokenLG,
  StyledBuyTokenBanner,
  StyledTokensNumber,
  StyledNavProfileWrapper,
} from './styled';
import Content from './Content';
import  ButtonWrapper  from 'v2/apps/prosper/shared/ButtonWrapper';
import  SafeBox  from "v2/apps/prosper/shared/SafeBox";

const { iconTokenEmptySmall, iconTokenSmall } = CONSTANTS.s3;

const subscriptionHelper = new Subscription();
const HeaderContent = (props) => {
  const [nav1Modal, setNav1Modal] = useState(false);
  const [nav2Modal, setNav2Modal] = useState(false);
  const [mobileModal, setMobileModal] = useState(false);
  const { t } = useTranslation();
  const { profileProps, claimToken } = props;
  const {
    membership,
    info,
    token_prices: tokenPrices,
    canClaimFreeTokens,
    country,
  } = profileProps;
  const { subscription_id: subscriptionId } = info;
  const tokens = (membership && membership.tokens) || 0;

  const buyTokenCopy = canClaimFreeTokens
    ? 'claim-free-token'
    : 'buy-more-tokens';

  const isSafari = window.safari !== undefined || isIOS();
  const isIpad = window.safari !== undefined || isIpadOS();

  const showTokens = country && country.code && !country.code.includes('EU');
  return (
    <StyledContainer>
      {showTokens && (
        <StyledNotifications className="prosper-notifications">
          {subscriptionHelper.isTokenUser(subscriptionId) && (
            <StyledTokenLG
              className="prosper-tokens"
              canClaimFreeTokens={canClaimFreeTokens}
            >
              <TokenModal
                tokens={tokens}
                tokenPrices={tokenPrices}
                externalOpen={nav1Modal}
                subcontractor={profileProps}
                onHiddenModal={() => setNav1Modal(false)}
                canClaimFreeTokens={canClaimFreeTokens}
                claimToken={claimToken}
                openElement={
                  <SafeBox
                    className="buy-more-tokens-box"
                    sx={{
                      '& > button': {
                        height: '52px',
                        '&:hover': {
                          background: 'transparent',
                        },
                        '&:focus': {
                          background: 'transparent',
                        },
                      },
                    }}
                  >
                    <ButtonWrapper
                      id="navbar-token-text-button"
                      className="buy-more-tokens"
                      handleClick={() => setNav1Modal(true)}
                    >
                      <StyledTokensNumber isLabel>
                        <StyledBuyTokenBanner>
                          {t(buyTokenCopy)}
                        </StyledBuyTokenBanner>
                      </StyledTokensNumber>
                    </ButtonWrapper>
                  </SafeBox>
                }
              />
              <TokenModal
                tokens={tokens}
                tokenPrices={tokenPrices}
                externalOpen={nav2Modal}
                subcontractor={profileProps}
                onHiddenModal={() => setNav2Modal(false)}
                canClaimFreeTokens={canClaimFreeTokens}
                claimToken={claimToken}
                openElement={
                  <ButtonWrapper
                    id="navbar-token-coin-button"
                    handleClick={() => setNav2Modal(true)}
                  >
                    <Image
                      src={tokens ? iconTokenEmptySmall : iconTokenSmall}
                    />
                    <StyledTokensNumber
                      isSafari={isSafari}
                      isIpad={isIpad && isSafari}
                    >
                      {tokens || ''}
                    </StyledTokensNumber>
                  </ButtonWrapper>
                }
              />
            </StyledTokenLG>
          )}
        </StyledNotifications>
      )}
      <StyledSeparator className="prosper-nav-separator" />
      <StyledNavProfileWrapper>
        {showTokens && subscriptionHelper.isTokenUser(subscriptionId) && (
          <StyledTokenSM>
            <TokenModal
              tokens={tokens}
              tokenPrices={tokenPrices}
              externalOpen={mobileModal}
              subcontractor={profileProps}
              onHiddenModal={() => setMobileModal(false)}
              canClaimFreeTokens={canClaimFreeTokens}
              claimToken={claimToken}
              openElement={
                <ButtonWrapper
                  id="navbar-token-coin-mobile-button"
                  handleClick={() => setMobileModal(true)}
                >
                  <Box position="relative">
                    <Image
                      src={tokens ? iconTokenEmptySmall : iconTokenSmall}
                    />
                    <StyledTokensNumber
                      isSafari={isSafari}
                      isIpad={isIpad && isSafari}
                    >
                      {tokens || ''}
                    </StyledTokensNumber>
                  </Box>
                </ButtonWrapper>
              }
            />
          </StyledTokenSM>
        )}
        <Dropdown
          className="profile-section-prosper"
          isFixed
          renderOpenDropdown={(renderProps) => (
            <OpenDropdown {...props} {...renderProps} />
          )}
          content={<Content />}
          theme={props.theme}
          closeOnClickOutside={false}
        />
      </StyledNavProfileWrapper>
    </StyledContainer>
  );
};

export default HeaderContent;
