import React from 'react';
import { CONSTANTS, Image, Button } from 'clink-components';
import { getUrl, goTo } from 'v2/helpers/url';
import i18next from 'v2/helpers/i18n';
import { StyledFeed, StyledFeedElement } from './EmptyFeed.styled';

const {
  iconArrowdownLightblue,
  iconBuildingLightblue,
  iconChatLightblue,
  iconListLightblue,
} = CONSTANTS.s3;

const config = {
  opportunities: {
    title: i18next.t('empty-feed-opportunities-title'),
    subtitle: (
      <>
        {i18next.t('empty-feed-opportunities-subtitle1')}{' '}
        <strong>{i18next.t('empty-feed-opportunities-subtitle2')}</strong>
      </>
    ),
    img: iconBuildingLightblue,
  },
  enquiries: {
    title: i18next.t('empty-feed-enquiries-title'),
    subtitle: (
      <>
        {i18next.t('empty-feed-enquiries-subtitle1')}{' '}
        <strong>{i18next.t('empty-feed-enquiries-subtitle2')}</strong>
      </>
    ),
    img: iconListLightblue,
  },
  rooms: {
    title: i18next.t('empty-feed-rooms-title'),
    subtitle: (
      <>
        {i18next.t('empty-feed-rooms-subtitle1')}{' '}
        <strong>{i18next.t('empty-feed-rooms-subtitle2')}</strong>
      </>
    ),
    img: iconChatLightblue,
  },
};
const EmptyFeed = ({ type = 'rooms' }) => {
  const { title, subtitle, img } = config[type];

  return (
    <StyledFeed>
      <StyledFeedElement first>{title}</StyledFeedElement>
      <StyledFeedElement second>
        <Image src={img} />
      </StyledFeedElement>
      <StyledFeedElement third small>
        {subtitle}
      </StyledFeedElement>
      <StyledFeedElement fourth>
        <Image src={iconArrowdownLightblue} />
      </StyledFeedElement>
      <StyledFeedElement fifth>
        <Button
          color="prosperButton"
          sizeBtn="large"
          handleClick={() =>
            goTo(getUrl('prosper', '/my-company/prequalification'))
          }
        >
          {i18next.t('complete-prequalification')}
        </Button>
      </StyledFeedElement>
    </StyledFeed>
  );
};

export default EmptyFeed;
