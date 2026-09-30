import React from 'react';
import { CONSTANTS, Image, Button } from 'clink-components';
import { connect } from 'react-redux';
import MuiButton from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import { goToNewTab } from 'v2/helpers/url';
import Subscription from 'v2/helpers/user/subscription';
import { useTranslation } from 'react-i18next';
import {
  StyledNeedHelpWrapper,
  StyledNeedHelpDescription,
  StyledNeedHelpBold,
  StyledNeedHelpLigament,
} from './styled';

const { calendarGreen, iconQuestionBlack } = CONSTANTS.s3;

const subscriptionHelper = new Subscription();
const NeedHelp = ({ subcontractor }) => {
  const { t } = useTranslation();
  let url = BASE_URLS.HUBSPOT_PROSPER_CALENDAR_PRO;
  if (
    subcontractor &&
    subscriptionHelper.isLite(subcontractor.subscription_id)
  ) {
    url = BASE_URLS.HUBSPOT_PROSPER_CALENDAR_LITE;
  }
  const countryCode =
    subcontractor && subcontractor.country && subcontractor.country.code;

  if (countryCode !== 'UK') {
    return null;
  }
  return (
    <>
      <Box sx={{ display: { xs: 'initial', md: 'none' } }}>
        <Tooltip
          title={`${t('need-help')} - ${t('why-not-call')}`}
          placement="bottom"
        >
          <MuiButton
            sx={{
              minWidth: { xs: '40px', md: 'initial' },
              '& > span': {
                height: '24px',
              },
            }}
            href={url}
            target="_blank"
          >
            <Image src={iconQuestionBlack} />
          </MuiButton>
        </Tooltip>
      </Box>
      <Box sx={{ display: { xs: 'none', md: 'initial' } }}>
        <Button
          layout="need-help"
          handleClick={() => {
            goToNewTab(url, '_blank');
          }}
        >
          <StyledNeedHelpWrapper>
            <StyledNeedHelpDescription>
              <StyledNeedHelpBold>{t('need-help')}</StyledNeedHelpBold>{' '}
              <StyledNeedHelpLigament>-</StyledNeedHelpLigament>
              {t('why-not-call')}
            </StyledNeedHelpDescription>
            <Image src={calendarGreen} />
          </StyledNeedHelpWrapper>
        </Button>
      </Box>
    </>
  );
};

const mapStateToProps = (state) => ({
  subcontractor: state.subcontractor,
});

export default connect(mapStateToProps)(NeedHelp);
