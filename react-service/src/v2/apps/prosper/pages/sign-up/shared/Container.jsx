import React from 'react';
import i18next from 'v2/helpers/i18n';
import { Image, CONSTANTS } from 'clink-components';
import Grid from '@mui/material/Grid';
import Title from './Title';
import Footer from './Footer';

const { prosperLogoFull } = CONSTANTS.s3;

const sideMargin = {
  lg: 16,
  md: 9,
  xs: 3,
};

const initialList = [
  {
    props: { to: BASE_URLS.ADMIN_LOGIN },
    linkCopy: i18next.t('login'),
    linkDesc: i18next.t('already-have-account'),
  },
];

const pageTitle = i18next.t('sign-up');

const Container = ({
  children,
  styles = {},
  extra = {},
  linkList = initialList,
  resend = false,
  useSubmitted = [],
  useLoading = [],
  logo = true,
  name = true,
  nameText = pageTitle,
  footer = true,
}) => {
  return (
    <Grid
      container
      sx={{
        marginLeft: sideMargin,
        marginRight: 'auto',
        marginTop: {
          lg: 7,
          md: 11,
          xs: 3,
        },
      }}
    >
      <Grid item lg={4} md={6} xs={10.5}>
        <Grid container flexDirection="column">
          {logo && (
            <Grid item marginBottom={styles.mb}>
              <Image src={prosperLogoFull} style={{ height: styles.img }} />
            </Grid>
          )}
          {name && (
            <Title
              styles={{
                fontSize: styles.subtitleSize,
                display: 'inline-block',
                marginBottom: '20px',
              }}
              variant="title2"
              title={nameText}
            />
          )}
          <Grid item {...extra}>
            {children}
          </Grid>
          {footer && (
            <Footer
              resend={resend}
              linkList={linkList}
              useSubmitted={useSubmitted}
              useLoading={useLoading}
            />
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Container;
