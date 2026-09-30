import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useContext } from 'hooks/context';
import Cookies from 'js-cookie';
import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';
import Wrapper from 'v2/apps/prosper/pages/sign-up/shared/Wrapper';
import OptViewer from 'v2/apps/widgets/opportunity-viewer';
import Title from './shared/Title';
import Container from './shared/Container';

const ThankYou = ({ token, styles, contextType = 'prosper', dispatch }) => {
  const { t } = useTranslation();
  const context = useContext(contextType);
  const { actions } = context;
  const { data = null } = token;
  const location = useLocation();
  const [idRegion, setIdRegion] = useState();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tokenFromUrl = queryParams.get('token');
    const sessionToken = tokenFromUrl || Cookies.get('sessionToken');
    if (sessionToken) {
      dispatch(actions.verifyToken(sessionToken));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  useEffect(() => {
    if (data && data.meta) {
      const meta = JSON.parse(data.meta);
      setIdRegion(Number(meta.region_id) || 0);
    }
  }, [data]);

  const initialList = [
    {
      props: { to: '/my-company' },
      linkCopy: t('complete-your-profile'),
    },
    {
      props: { to: '/resources/how-it-works' },
      linkCopy: t('how-to-use-prosper'),
    },
  ];

  return (
    <Container styles={styles} linkList={initialList}>
      <Grid container flexDirection="column">
        <Title
          styles={{
            fontSize: styles.titleSize,
            whiteSpace: styles.noWrap,
          }}
          marginBottom={styles.mb}
          title={t('thank-you')}
        />
        <Title
          marginBottom={styles.mb}
          variant="normal"
          fontWeight={200}
          title={t('thank-you-desc-1')}
        />
        <Title
          marginBottom={styles.mb}
          variant="normal"
          fontWeight={200}
          title={t('thank-you-desc-2')}
        />
        <Grid item>
          <OptViewer
            title={t('thank-you-widget-title')}
            discover
            show={false}
            idRegion={idRegion}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

const mapStateToProps = (state) => ({
  token: state.token,
});

const ThankYouStep = (props) => <Wrapper Component={ThankYou} {...props} />;

export default connect(mapStateToProps)(ThankYouStep);
