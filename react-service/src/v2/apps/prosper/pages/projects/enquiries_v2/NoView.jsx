import React from 'react';
import WISTIA from 'v2/constants/wistia';
import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';
import { useTranslation } from 'react-i18next';
import { getUrl, wistiaConfigUrl } from 'v2/helpers/url';
import Subscription from 'v2/helpers/user/subscription';
import useScript from 'hooks/useScript';

const { avantGardeGothicPRO } = CONSTANTS.fonts;
const { LG_SCREEN, MD_SCREEN, SM_SCREEN } = CONSTANTS.dimensions;

const Wrapper = styled.div`
  display: block;
  flex-direction: column;
  align-items: center;
`;

const common = `
  text-align: center;
  font-family: ${avantGardeGothicPRO};
`;
const Title = styled.h1`
  font-weight: bold;
  font-size: 21px;
  ${common}
`;

const Text = styled.p`
  font-size: 14px;
  ${common}
`;

const Video = styled.div`
  width: ${LG_SCREEN}px;
  height: 565px;
  margin: auto;
  margin-top: 15px;
  margin-bottom: 15px;
  box-sizing: border-box;
  @media (max-width: ${LG_SCREEN - 1}px) {
    width: ${MD_SCREEN}px;
    height: 439px;
  }
  @media (max-width: ${MD_SCREEN - 1}px) {
    width: 100%;
    height: 397px;
  }
  @media (max-width: ${SM_SCREEN - 1}px) {
    width: 100%;
    height: 275px;
  }
`;

const subscriptionHelper = new Subscription();
const NoView = ({ subcontractor = null }) => {
  const { t } = useTranslation();
  let id = WISTIA && WISTIA.NO_VIEW_ENQUIRIES;
  if (
    subcontractor &&
    !subscriptionHelper.isActivatedSupplyChain(subcontractor.subscription_id)
  ) {
    id = WISTIA && WISTIA.WHAT_ARE_TOKENS_MODAL;
  }
  useScript(wistiaConfigUrl(id));
  useScript(WISTIA.CONFIG_URL);

  const isUK =
    subcontractor &&
    subcontractor.country &&
    subcontractor.country.code &&
    subcontractor.country.code === 'UK';

  return (
    <Wrapper>
      <Title>
        {t(isUK ? 'enquiry-no-view-title' : 'enquiry-no-view-title-2')}
      </Title>
      {isUK && (
        <Video
          className="wistia_responsive_padding"
          style={{ position: 'relative' }}
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
              style={{ height: '100%', position: 'relative', width: '100%' }}
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
        </Video>
      )}
      <Text>
        {t('enquiry-no-view-text-1')},{' '}
        <a href={getUrl('prosper', '/my-company/prequalification')}>
          {t('enquiry-no-view-text-2')}
        </a>
      </Text>
    </Wrapper>
  );
};

export default NoView;
