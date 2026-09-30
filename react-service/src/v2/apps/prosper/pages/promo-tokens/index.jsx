import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import Typography from '@mui/material/Typography';
import { Image, CONSTANTS } from 'clink-components';
import Loading from 'v2/apps/shared/components/Loading';
import { getQueryStringVars } from 'v2/helpers/url';
import { useContext } from 'hooks/context';
import { useTheme } from '@mui/material/styles';
import { StyledPromoTokens, StyledSubPanel, StyledH1 } from './styled';

const { prosperLogoFull } = CONSTANTS.s3;

const PromoToken = ({
  token,
  isValid = false,
  contextType = 'prosper',
  dispatch,
}) => {
  const [validMessage, setValidMessage] = useState(isValid);
  const { tokenAward, loading, success } = token;
  const { t } = useTranslation();
  const context = useContext(contextType);
  const { actions } = context;

  useEffect(() => {
    const params = getQueryStringVars();
    const { token: tokenUrl } = params;
    if (tokenUrl) {
      dispatch(actions.checkToken(tokenUrl));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setValidMessage(success);
  }, [success]);

  const theme = useTheme();
  const { palette } = theme;

  return (
    <StyledPromoTokens>
      <>
        <Image src={prosperLogoFull} />
        <StyledSubPanel>
          <StyledH1>Promo Tokens</StyledH1>
        </StyledSubPanel>
        {loading && <Loading status="Checking token" />}
        {!loading && validMessage && (
          <div>
            <Typography
              variant="h4"
              align="center"
              color={palette.error.main}
              mt={5}
            >
              {t('provided-token-success')}
            </Typography>
            <Typography
              variant="body2"
              align="center"
              color={palette.primary.main}
              mt={3}
            >
              {t('token-award', { count: tokenAward })}: <b>{tokenAward}</b>
            </Typography>
          </div>
        )}
        {!loading && !validMessage && (
          <div>
            <Typography
              variant="h4"
              align="center"
              color={palette.error.main}
              mt={5}
            >
              {t('provided-token-error')}
            </Typography>
            <br />
          </div>
        )}
      </>
    </StyledPromoTokens>
  );
};

const mapStateToProps = (state) => {
  return {
    token: state.token,
  };
};

export default connect(mapStateToProps)(PromoToken);
