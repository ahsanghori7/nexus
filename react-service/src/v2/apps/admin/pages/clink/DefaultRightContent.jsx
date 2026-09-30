import React from 'react';
import { GhostMode, Image, CONSTANTS } from 'clink-components';
import i18next from 'v2/helpers/i18n';
import { goTo } from 'v2/helpers/url';

const { blackCarretDown, blackCarretUp, hatLogo } = CONSTANTS.s3;

const DefaultRightContent = ({ options, children }) => (
  <>
    <GhostMode
      title={
        <>
          <Image src={hatLogo} />
          <b>{i18next.t('ghost-mode-title')}</b>&nbsp;
        </>
      }
      options={options}
      onClickOptions={(option) => {
        goTo(
          `${BASE_URLS.APP_CLINK}/relay?action=account&method=switchGhostMode&redirect_user_id=${option.id}`
        );
      }}
      downIcon={<Image src={blackCarretDown} />}
      upIcon={<Image src={blackCarretUp} />}
    />
    {children}
  </>
);

export default DefaultRightContent;
