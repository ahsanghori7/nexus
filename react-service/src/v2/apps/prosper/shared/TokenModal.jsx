import React, { useState } from 'react';
import i18next from 'v2/helpers/i18n';
import isNumber from 'lodash/isNumber';
import { Modal, Button, Image, CONSTANTS } from 'clink-components';
import { goTo, getUrl } from 'v2/helpers/url';
import { useTranslation } from 'react-i18next';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Subscription from 'v2/helpers/user/subscription';
import {
  StyledModalContent,
  StyledTokenModalText,
  StyledTokenOffers,
  StyledTokenOffersItem,
  StyledTokenOffersItemPrice,
  StyledTokenOffersItemPriceToken,
  StyledTokenOffersItemPriceTokenNumber,
  StyledTokenOffersItemSavings,
  StyledTokenOffersItemButton,
  StyledTokenGreenText,
  StyledH1,
  StyledTokenSubnote,
  StyledTokenLinkWrapper,
  StyledTokenLink,
  StyledTokenRedText,
} from './styled';

const {
  iconTokenEmptyBig,
  closeButton,
  freeTokenAwardedBlank,
} = CONSTANTS.s3;
const { avantGardeGothicPRO } = CONSTANTS.fonts;

const { prosperBoxRed } = CONSTANTS.colors.prosper;
const SubscriptionHelper = new Subscription();

const TokenItem = ({ elem = {}, t = () => null, buyCopy = '' }) => {
  const handleClick = elem.checkout_url
    ? () => goTo(elem.checkout_url)
    : elem.claimToken;
  return (
    <StyledTokenOffersItem>
      <StyledTokenOffersItemPrice>
        <StyledTokenOffersItemPriceToken>
          <StyledTokenOffersItemPriceTokenNumber>
            {elem.tokens_received}
          </StyledTokenOffersItemPriceTokenNumber>
          <Image src={iconTokenEmptyBig} />
        </StyledTokenOffersItemPriceToken>{' '}
        {isNumber(elem.price) && '='}
        <StyledTokenGreenText fontWeight={700}>
          {elem.price}
          {isNumber(elem.price) && <StyledTokenRedText>*</StyledTokenRedText>}
        </StyledTokenGreenText>
      </StyledTokenOffersItemPrice>
      {elem.label && (
        <StyledTokenOffersItemSavings>
          {t('save-over')}
          <StyledTokenGreenText>{elem.label}</StyledTokenGreenText>
        </StyledTokenOffersItemSavings>
      )}
      <StyledTokenOffersItemButton>
        <Button
          id={`buy-now-button-${elem.tokens_received}`}
          handleClick={handleClick}
        >
          {t(buyCopy)}
        </Button>
      </StyledTokenOffersItemButton>
    </StyledTokenOffersItem>
  );
};

const TokenModal = ({
  externalOpen,
  title = 'buy-more-tokens-title',
  tokenPrices = [],
  subcontractor = null,
  onHiddenModal = null,
  openElement,
  canClaimFreeTokens = false,
  hasTokenUrl = false,
  claimToken = () => null,
}) => {
  const [claimSuccess, setClaimSuccess] = useState(false);
  const { t } = useTranslation();
  const handleClaimToken = () =>
    claimToken().then((result) => {
      const { success } = result && result.payload;
      if (success) {
        setClaimSuccess(true);
      }
    });
  const idSubscription = subcontractor ? subcontractor.subscription_id : 0;
  const modalTitle = claimSuccess ? null : title;
  const isUnlock = t(title) === t('buy-more-tokens-title-3');

  const topUp = subcontractor && subcontractor.tokens_top_up;
  const countText = topUp && Number(topUp) > 1 ? 'free-tokens' : 'free-token';
  const freeTokenLabel = `${topUp ? `${topUp} ` : ''}${t(countText)}`;

  const freeIcon = freeTokenAwardedBlank;
  const isFlexi = Number(idSubscription) === SubscriptionHelper.getType().FLEXI;
  const marginHasToken = {};
  if (hasTokenUrl) {
    marginHasToken.marginBottom = '30px';
  }
  const newPrices = tokenPrices.map((elem) => ({
    ...elem,
    price: elem.price.replaceAll('£', i18next.t('currency')),
  }));
  return (
    <Modal
      onHidden={() => {
        if (claimSuccess) {
          setClaimSuccess(false);
        }
        onHiddenModal();
      }}
      externalOpen={externalOpen}
      className={`action-required-modal buy-token-modal ${
        canClaimFreeTokens && ' free-token'
      } ${isUnlock && ' is-unlock'}`}
      openElement={openElement}
      render={() => (
        <StyledModalContent
          className="packages-modal-content"
          position="relative"
        >
          <IconButton
            sx={{
              backgroundColor: 'transparent !important',
              position: 'absolute',
              right: {
                xs: 3,
                sm: -55,
              },
              top: {
                xs: -41,
                sm: -45,
              },
              padding: '0 !important',
            }}
            aria-label="delete"
            size="small"
            onClick={() => {
              if (claimSuccess) {
                setClaimSuccess(false);
              }
              onHiddenModal();
            }}
          >
            <Image src={closeButton} />
          </IconButton>
          <StyledH1>
            {modalTitle && (
              <p style={{ flex: '1 0 100%', ...marginHasToken }}>
                {t(modalTitle)}
              </p>
            )}
            {claimSuccess && isFlexi && (
              <p
                style={{
                  flex: '1 0 100%',
                  color: prosperBoxRed,
                  paddingTop: 8,
                }}
              >
                {t('buy-more-tokens-title-5')}
              </p>
            )}
          </StyledH1>
          {!claimSuccess && !hasTokenUrl && (
            <>
              {canClaimFreeTokens ? (
                <StyledTokenModalText>
                    {t('buy-more-tokens-instructions-5')}
                  </StyledTokenModalText>
              ) : (
                <StyledTokenModalText>
                  {t('buy-more-tokens-instructions-1')}
                  <b>{t('buy-more-tokens-instructions-2')}</b>
                  {t('buy-more-tokens-instructions-3')}
                </StyledTokenModalText>
              )}

              <StyledTokenSubnote>
                <StyledTokenRedText>* </StyledTokenRedText>
                {t('prices-exclude-vat')}
              </StyledTokenSubnote>
            </>
          )}
          <StyledTokenOffers>
            {!claimSuccess && (
              <>
                {canClaimFreeTokens && (
                  <TokenItem
                    t={t}
                    elem={{
                      tokens_received: topUp,
                      price: freeTokenLabel,
                      claimToken: handleClaimToken,
                    }}
                    buyCopy="claim-now"
                  />
                )}
                {newPrices.map((elem) => (
                  <TokenItem
                    t={t}
                    elem={elem}
                    key={elem.tokens_received}
                    buyCopy="buy-now"
                  />
                ))}
              </>
            )}
            {claimSuccess && (
              <Grid container flexDirection="column" mt={isFlexi ? 5 : 0}>
                <Grid item position="relative">
                  <Image src={freeIcon} />
                  <Box
                    component="span"
                    position="absolute"
                    sx={{
                      top: {
                        xs: '5px !important',
                        sm: '0 !important',
                      },
                      left: {
                        xs: 0,
                        sm: '10px',
                      },
                      background: 'transparent !important',
                      fontSize: '30px',
                      fontFamily: avantGardeGothicPRO,
                      color: '#CF8E1B !important', // TODO: color
                    }}
                  >
                    {topUp || 1}
                  </Box>
                </Grid>
                <Grid item sx={{ fontSize: 21 }} mt={3}>
                  <StyledTokenGreenText fontWeight={700}>
                    {t('buy-more-tokens-title-6').toUpperCase()}
                  </StyledTokenGreenText>
                </Grid>
              </Grid>
            )}
          </StyledTokenOffers>
          <StyledTokenLinkWrapper>
            <StyledTokenLink
              target="_blank"
              href={`${getUrl('prosper', BASE_URLS.TOKENS)}`}
            >
              {t('what-are-tokens')}
            </StyledTokenLink>
          </StyledTokenLinkWrapper>
        </StyledModalContent>
      )}
    />
  );
};

export default TokenModal;
