import React from 'react';
import { Image, CONSTANTS } from 'clink-components';
import Subscription from 'v2/helpers/user/subscription';
import MuiButton from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useContext } from 'hooks/context';
import TokenButton from './TokenButton';
import HelpButton from './HelpButton';
import breadcrumbsConfig from './breadcrumbsConfig';

const { aliceBlue } = CONSTANTS.colors.general;
const { iconDownloadBlack } = CONSTANTS.s3;
const subscriptionHelper = new Subscription();

const useSubheader = (
  subcontractor = {},
  dispatch = () => {},
  title = '',
  url = '',
  companyName = null,
  projectName = null,
  lock = null,
) => {
  const theme = useTheme();
  const context = useContext('prosper');
  const { actions, pages } = context;
  const { subscription_id: subscriptionId, tokenPrices, info } = subcontractor;

  const noGetTokens = url.includes('/my-company/prequalification');

  let subRightContent = null;
  if (subscriptionHelper.isTokenUser(subscriptionId) && !noGetTokens && !lock) {
    subRightContent = (
      <TokenButton
        tokenPrices={tokenPrices}
        subcontractor={subcontractor}
        claimToken={() => dispatch(actions.claimToken())}
      />
    );
  }
  const countryCode =
    subcontractor && subcontractor.country && subcontractor.country.code;
  if (countryCode !== 'UK') {
    subRightContent = (
      <div
        style={{ height: '35px', width: '100%', backgroundColor: aliceBlue }}
      />
    );
  }
  const aid = subcontractor && info && info.account_id;
  const mainMiddleLeftContent = aid && noGetTokens && (
    <Tooltip title="Download" placement="bottom">
      <MuiButton
        sx={{
          minWidth: { xs: '40px', md: 'initial' },
          marginRight: { xs: 'initial', md: '15px' },
          '& > span': {
            height: '24px',
          },
        }}
        href={`/relay/v1/prequalification/${aid}/export_pdf`}
        target="_blank"
      >
        <Image src={iconDownloadBlack} />
      </MuiButton>
    </Tooltip>
  );
  const mainMiddleContent = <HelpButton />;

  // TODO: Investigate fixing duplicate i18n entries
  const breadcrumbsItems = breadcrumbsConfig(
    subcontractor,
    companyName,
    projectName,
    pages,
  );

  const maxItems = useMediaQuery(theme.breakpoints.up('sm')) ? 3 : 2;
  const pageHeader = {
    title,
    subRightContent,
    mainMiddleContent,
    mainMiddleLeftContent,
    breadcrumbsItems,
    maxItems,
  };

  return pageHeader;
};

export default useSubheader;
