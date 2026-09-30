import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';
import Wrapper from 'v2/apps/prosper/pages/sign-up/shared/Wrapper';
import { useParams } from 'react-router-dom';
import { fetchData } from 'services/helpers';
import Title from './shared/Title';
import Container from './shared/Container';

function EmailCheck({ styles }) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const params = useParams();
  const { t } = useTranslation();

  const { token } = params;

  const handleSubmit = () => {
    setSubmitted(false);
    setLoading(true);
    return fetchData('account', {}, `activation_resend/${token}`, '', '')
      .then((result) => {
        if (result.success) {
          setSubmitted(1);
        } else {
          setSubmitted(2);
        }
        setLoading(false);
      })
      .catch(() => {
        setSubmitted(3);
        setLoading(false);
      });
  };
  const initialList = [
    {
      props: { onClick: handleSubmit, to: '#' },
      linkCopy: t('resend'),
      linkDesc: t('didnt-receive'),
    },
  ];
  return (
    <Container
      styles={styles}
      linkList={initialList}
      resend
      useSubmitted={[submitted, setSubmitted]}
      useLoading={[loading, setLoading]}
    >
      <Grid container flexDirection="column">
        <Title
          styles={{
            fontSize: styles.titleSize,
            whiteSpace: styles.noWrap,
          }}
          marginBottom={styles.mb}
          title={t('check-email')}
        />
        <Title
          marginBottom={styles.mb}
          variant="normal"
          fontWeight={200}
          title={t('check-email-desc')}
        />
      </Grid>
    </Container>
  );
}

const EmailCheckStep = () => <Wrapper Component={EmailCheck} />;

export default EmailCheckStep;
