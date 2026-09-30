import React, { useState } from 'react';
import WISTIA from 'v2/constants/wistia';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import TokenModal from 'v2/apps/prosper/shared/TokenModal';
import {
  StyledWrapper,
  StyledWrapperLeft,
  StyledContentLeft,
  StyledWrapperRight,
  StyledContentRight,
  StyledRed,
  StyledBold,
  StyledP,
  StyledTitle,
  StyledTitle2,
  StyledDescription,
  StyledDiscalimer,
  StyledButtonWrapper,
  StyledVideoOld,
} from 'v2/apps/shared/styled/LandingPage.styled';
import { useContext } from 'hooks/context';
import ButtonWrapper from 'v2/apps/prosper/shared/ButtonWrapper';

const Tokens = ({ subcontractor, dispatch }) => {
  const [modal, setModal] = useState(false);
  const { t } = useTranslation();
  const context = useContext('prosper');
  const { actions } = context;
  const { token_prices, canClaimFreeTokens } = subcontractor;
  const buyTokenCopy = canClaimFreeTokens
    ? 'claim-free-token'
    : 'buy-tokens-now';

  const tokenPrices = token_prices ?? [];

  const videoMap =
    (WISTIA && WISTIA.WHAT_ARE_TOKENS && WISTIA.WHAT_ARE_TOKENS.B) ||
    'about:blank';

  return (
    <StyledWrapper>
      <StyledWrapperLeft>
        <StyledContentLeft>
          <StyledTitle>{t('what-are-tokens')}</StyledTitle>
          <StyledVideoOld
            title="prosper-enquiries"
            src={videoMap}
            allowFullScreen
            webkitallowfullscreen
            mozallowfullscreen
          />
          <StyledP>
            <StyledBold>
              {t('tokens-description-1a')}{' '}
              <StyledRed>{t('tokens-description-1b')}</StyledRed>
            </StyledBold>
          </StyledP>
          <StyledP>{t('tokens-description-2')}</StyledP>
          <StyledP>
            {t('tokens-description-3a')}{' '}
            <StyledBold>{t('tokens-description-3b')}</StyledBold>
          </StyledP>
        </StyledContentLeft>
      </StyledWrapperLeft>
      <StyledWrapperRight>
        <StyledContentRight>
          <StyledTitle>{t('faq')}</StyledTitle>
          <StyledTitle2>{t('token-faq-question-1')}</StyledTitle2>
          <StyledDescription>{t('token-faq-answer-1')}</StyledDescription>
          <StyledTitle2>{t('token-faq-question-2')}</StyledTitle2>
          <StyledDescription>{t('token-faq-answer-2')}</StyledDescription>
          <StyledTitle2>{t('token-faq-question-3')}</StyledTitle2>
          <StyledDescription>{t('token-faq-answer-3')}</StyledDescription>
          <StyledTitle2>{t('token-faq-question-4')}</StyledTitle2>
          <StyledDescription>{t('token-faq-answer-4')}</StyledDescription>
          <StyledDiscalimer>
            {t('token-faq-disclaimer-1')}{' '}
            <StyledRed>{t('token-faq-disclaimer-2')}</StyledRed>
          </StyledDiscalimer>
          <StyledButtonWrapper>
            <TokenModal
              tokenPrices={tokenPrices}
              externalOpen={modal}
              subcontractor={subcontractor}
              onHiddenModal={() => setModal(false)}
              canClaimFreeTokens={subcontractor.canClaimFreeTokens}
              claimToken={() => dispatch(actions.claimToken())}
              openElement={
                <ButtonWrapper
                  className="buy-more-tokens"
                  color="secondary"
                  variant="contained"
                  size="large"
                  onClick={() => setModal(true)}
                >
                  {t(buyTokenCopy)}
                </ButtonWrapper>
              }
            />
          </StyledButtonWrapper>
        </StyledContentRight>
      </StyledWrapperRight>
    </StyledWrapper>
  );
};

const mapStateToProps = (state) => {
  return {
    subcontractor: state.subcontractor,
  };
};

export default connect(mapStateToProps)(Tokens);
