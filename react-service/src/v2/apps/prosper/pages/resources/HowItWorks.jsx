import React from 'react';
import { useTranslation } from 'react-i18next';
import useScript from 'hooks/useScript';
import {
  StyledWrapper,
  StyledWrapperLeft,
  StyledContentLeft,
  StyledWrapperRight,
  StyledContentRight,
  StyledRedLink,
  StyledBold,
  StyledP,
  StyledTitle,
  StyledTitle2,
  StyledDescription,
  StyledVideo,
  StyledContainer,
  StyledTextContainer,
  StyledSmallVideo,
} from 'v2/apps/shared/styled/LandingPage.styled';
import { wistiaConfigUrl } from 'v2/helpers/url';
import WISTIA from 'v2/constants/wistia';

const videos = WISTIA.HOW_IT_WORKS.SHOW;

const HowItWorks = () => {
  const { t } = useTranslation();

  // TODO: Remove these hardcode videos for when we have the full list
  const id = '48k33gepgr';

  useScript(wistiaConfigUrl(id));
  useScript(WISTIA.CONFIG_URL);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  videos.map((video) => useScript(wistiaConfigUrl(video.id)));

  return (
    <StyledWrapper>
      <StyledWrapperLeft>
        <StyledContentLeft>
          <StyledTitle>{t('welcome-to-prosper')}</StyledTitle>
          <StyledVideo
            className="wistia_responsive_padding"
            style={{ position: 'relative' }}
            howItWorks
          >
            <div
              className="wistia_responsive_wrapper"
              style={{
                height: '100%',
                left: 0,
                position: 'absolute',
                top: 0,
                width: '100%',
              }}
            >
              <div
                className={`wistia_embed wistia_async_${id} videoFoam=true`}
                style={{
                  height: '100%',
                  position: 'relative',
                  width: '100%',
                }}
              >
                <div
                  className="wistia_swatch"
                  style={{
                    height: '100%',
                    left: 0,
                    opacity: 0,
                    overflow: 'hidden',
                    position: 'absolute',
                    top: 0,
                    transition: 'opacity 200ms',
                    width: '100%',
                  }}
                >
                  <img
                    src={wistiaConfigUrl(id, '/swatch')}
                    style={{
                      filter: 'blur(5px)',
                      height: '100%',
                      objectFit: 'contain',
                      width: '100%',
                    }}
                    alt=""
                    aria-hidden="true"
                    onLoad={(e) => {
                      e.target.parentNode.style.opacity = 1;
                    }}
                  />
                </div>
              </div>
            </div>
          </StyledVideo>
          <StyledP>
            <StyledBold>{t('how-it-works-description-1')}</StyledBold>
          </StyledP>
          <StyledP>{t('how-it-works-description-2')}</StyledP>
          <StyledP>
            {t('how-it-works-description-3a')}{' '}
            <StyledRedLink href={`mailto:${t('how-it-works-email')}`}>
              {t('how-it-works-email')}
            </StyledRedLink>
            {t('how-it-works-description-3b')}
          </StyledP>
        </StyledContentLeft>
      </StyledWrapperLeft>
      <StyledWrapperRight>
        <StyledContentRight>
          <StyledTitle>{t('video-guides')}</StyledTitle>
          {videos.map((v) => (
            <StyledContainer key={v.title}>
              <StyledSmallVideo className={v.link} />
              <StyledTextContainer>
                <StyledTitle2>{v.title}</StyledTitle2>
                <StyledDescription>{v.description}</StyledDescription>
              </StyledTextContainer>
            </StyledContainer>
          ))}
        </StyledContentRight>
      </StyledWrapperRight>
    </StyledWrapper>
  );
};

export default HowItWorks;
