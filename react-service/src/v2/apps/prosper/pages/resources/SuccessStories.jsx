import React, { useState } from 'react';
import WISTIA from 'v2/constants/wistia';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Image, CONSTANTS, HOOKS } from 'clink-components';
import StyledContainer, {
  StyledSection,
  StyledText,
  StyledParagraph,
  StyledStrong,
  StyledTitle,
  Slide,
  Winners,
  CompanyLink,
} from 'v2/apps/shared/styled/Page.styled';
import useScript from 'hooks/useScript';
import { getQueryStringVars, wistiaConfigUrl } from 'v2/helpers/url';
import Subscription from 'v2/helpers/user/subscription';
import TokenModal from 'v2/apps/prosper/shared/TokenModal';
import ProsperCarousel from 'v2/apps/prosper/shared/carousel';
import ArrowButton from 'v2/apps/prosper/shared/carousel/ArrowButton';
import { StyledButtonWrapper } from 'v2/apps/shared/styled/LandingPage.styled';
import { useContext } from 'hooks/context';
import clients from './clients';
import ButtonWrapper from 'v2/apps/prosper/shared/ButtonWrapper';

const { useWindowDimensions } = HOOKS;
const { redCaretLeft, redCaretRight } = CONSTANTS.s3;
const { LG_SCREEN } = CONSTANTS.dimensions;
const subscriptionHelper = new Subscription();

const SuccessStories = ({ subcontractor, dispatch }) => {
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState(false);
  const windowDimensions = useWindowDimensions();
  const context = useContext('prosper');
  const { actions } = context;
  const isMobile = windowDimensions.width < LG_SCREEN;
  const { SUCCESS } = WISTIA;
  if (WISTIA && SUCCESS) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    SUCCESS.forEach((video) => useScript(wistiaConfigUrl(video)));
  }
  useScript(WISTIA.CONFIG_URL);
  const { t } = useTranslation();
  const {
    token_prices,
    subscription_id: subscriptionId,
    canClaimFreeTokens,
  } = subcontractor;
  const buyTokenCopy = canClaimFreeTokens
    ? 'claim-free-token'
    : 'buy-tokens-now';

  const tokenPrices = token_prices ?? [];

  const textMargin1 = !isMobile ? '12px 4px 36px' : '16px -8px 0px';
  const textMargin2 = !isMobile ? '29px 49px 63px' : '22px 49px 37px';
  const carouselProps1 = {
    showThumbs: false,
    showStatus: false,
    className: 'carousel-winners',
    renderArrowPrev: (prevItem, label) => (
      <ArrowButton
        nextItem={() => {
          if (isMobile) {
            prevItem();
          } else {
            setPage(0);
          }
        }}
        label={label}
        src={redCaretLeft}
        className="control-arrow control-prev"
      />
    ),
    renderArrowNext: (nextItem, label) => (
      <ArrowButton
        nextItem={() => {
          if (isMobile) {
            nextItem();
          } else {
            setPage(1);
          }
        }}
        label={label}
        src={redCaretRight}
        className="control-arrow control-next"
      />
    ),
  };
  const carouselProps2 = {
    showThumbs: false,
    infiniteLoop: true,
    showStatus: false,
  };
  if (!isMobile) {
    carouselProps1.centerSlidePercentage = 50;
    carouselProps2.centerSlidePercentage = 33;
    carouselProps2.centerMode = true;
    carouselProps1.centerMode = true;
  }
  const filteredClients = clients.filter(
    (client) =>
      client.name &&
      client.src &&
      client.company &&
      client.paragraph &&
      client.link,
  );
  let popupOnLoad = '';
  if (getQueryStringVars().popoverShowOnLoad) {
    popupOnLoad = `popoverShowOnLoad=true`;
  }
  return (
    <>
      <StyledSection>
        <StyledContainer>
          <StyledText>
            <StyledParagraph mobFontSize="13px">
              <StyledStrong>{t('winners-introduction-1')} </StyledStrong>
              <StyledStrong pink>{t('winners-introduction-2')}</StyledStrong>
            </StyledParagraph>
            <StyledParagraph mobFontSize="11px">
              {t('winners-introduction-3')}
            </StyledParagraph>
            <StyledParagraph mobFontSize="11px">
              <StyledStrong pink>{t('winners-introduction-4')}</StyledStrong>{' '}
              {t('winners-introduction-5')}
            </StyledParagraph>
            <StyledParagraph mobFontSize="11px">
              {t('winners-introduction-6')}{' '}
              <StyledStrong pink>{t('winners-introduction-7')}</StyledStrong>
            </StyledParagraph>
          </StyledText>
        </StyledContainer>
      </StyledSection>
      <StyledSection blue>
        <StyledContainer winners page={page}>
          <StyledTitle>{t('winners-title')}</StyledTitle>
          <ProsperCarousel carouselProps={carouselProps1}>
            <Slide isMobile={isMobile} winners>
              <Winners
                className={`wistia_embed wistia_async_${WISTIA.SUCCESS[0]} popover=true popoverAnimateThumbnail=true ${popupOnLoad}`}
              >
                &nbsp;
              </Winners>
              <StyledText margin={textMargin1}>
                <StyledParagraph
                  noMargin
                  padding="10px 10px 4px"
                  fontSize="16px"
                >
                  <StyledStrong purple>{t('winners-3-title')}</StyledStrong>
                </StyledParagraph>
                <StyledParagraph noMargin padding="0 10px 10px" fontSize="14px">
                  {t('winners-3-text-1')}
                  <StyledStrong>{t('pound')}1.5 million</StyledStrong>
                  {t('winners-3-text-2')}
                </StyledParagraph>
              </StyledText>
            </Slide>
            <Slide isMobile={isMobile} winners>
              <Winners
                className={`wistia_embed wistia_async_${WISTIA.SUCCESS[1]} popover=true popoverAnimateThumbnail=true`}
              >
                &nbsp;
              </Winners>
              <StyledText margin={textMargin1}>
                <StyledParagraph
                  noMargin
                  padding="10px 10px 4px"
                  fontSize="16px"
                >
                  <StyledStrong purple>{t('winners-1-title')}</StyledStrong>
                </StyledParagraph>
                <StyledParagraph noMargin padding="0 10px 10px" fontSize="14px">
                  {t('winners-1-text-1')}
                  <StyledStrong>{t('pound')}250,000</StyledStrong>
                  {t('winners-1-text-2')}
                </StyledParagraph>
              </StyledText>
            </Slide>
            <Slide isMobile={isMobile} winners>
              <Winners
                className={`wistia_embed wistia_async_${WISTIA.SUCCESS[2]} popover=true popoverAnimateThumbnail=true`}
              >
                &nbsp;
              </Winners>
              <StyledText margin={textMargin1}>
                <StyledParagraph
                  noMargin
                  padding="10px 10px 4px"
                  fontSize="16px"
                >
                  <StyledStrong purple>{t('winners-2-title')}</StyledStrong>
                </StyledParagraph>
                <StyledParagraph noMargin padding="0 10px 10px" fontSize="14px">
                  {t('winners-2-text-1')}
                  <StyledStrong>{t('pound')}16m</StyledStrong>
                  {t('winners-2-text-2')}
                </StyledParagraph>
              </StyledText>
            </Slide>
          </ProsperCarousel>
        </StyledContainer>
      </StyledSection>
      <StyledSection purple>
        <StyledContainer>
          <StyledTitle white>{t('clients-say')}</StyledTitle>
          <ProsperCarousel carouselProps={carouselProps2}>
            {filteredClients.map((client) => (
              <Slide key={client.name} isMobile={isMobile} clients>
                {client.src && (
                  <Image alt={client.name} src={client.src} width={176} />
                )}
                <StyledText margin={textMargin2} mauve>
                  <StyledParagraph fontSize="14px" center height="140px">
                    {t(client.paragraph)}
                  </StyledParagraph>
                  <StyledParagraph fontSize="13px" center noMargin>
                    <StyledStrong white>{client.name}</StyledStrong> -{' '}
                    {client.company}
                  </StyledParagraph>
                  {client.link && (
                    <StyledParagraph center fontSize="13px">
                      <CompanyLink target="_blank" href={client.link}>
                        {client.link}
                      </CompanyLink>
                    </StyledParagraph>
                  )}
                </StyledText>
              </Slide>
            ))}
          </ProsperCarousel>
        </StyledContainer>
      </StyledSection>
      {subscriptionHelper.isTokenUser(subscriptionId) && (
        <StyledSection>
          <StyledContainer>
            <StyledButtonWrapper successStories>
              <TokenModal
                tokenPrices={tokenPrices}
                externalOpen={modal}
                subcontractor={subcontractor}
                onHiddenModal={() => setModal(false)}
                canClaimFreeTokens={subcontractor.canClaimFreeTokens}
                claimToken={() => dispatch(actions.claimToken())}
                openElement={
                  <ButtonWrapper
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
          </StyledContainer>
        </StyledSection>
      )}
    </>
  );
};

const mapStateToProps = (state) => {
  return {
    subcontractor: state.subcontractor,
  };
};

export default connect(mapStateToProps)(SuccessStories);
