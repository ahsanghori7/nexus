import React from 'react';
import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';
import Wrapper from 'v2/apps/prosper/pages/sign-up/shared/Wrapper';
import Title from './shared/Title';
import Container from './shared/Container';

const AlreadyActiveContent = ({ styles }) => {
  const { t } = useTranslation();
  return (
    <Container styles={styles} nameText="">
      <Grid container flexDirection="column">
        <Title
          styles={{
            fontSize: styles.titleSize,
            whiteSpace: styles.noWrap,
          }}
          marginBottom={styles.mb}
          title={t('text-account-already-active')}
        />
      </Grid>
    </Container>
  );
};

const AlreadyActive = () => <Wrapper Component={AlreadyActiveContent} />;
export default AlreadyActive;
