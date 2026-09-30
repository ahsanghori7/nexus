import React, { useState } from 'react';
import Grid from '@mui/material/Grid2';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import { Link as ReactLink } from 'react-router-dom';
import Wrapper from 'v2/apps/prosper/pages/sign-up/shared/Wrapper';
import Title from 'v2/apps/prosper/pages/sign-up/shared/Title';
import Container from 'v2/apps/prosper/pages/sign-up/shared/Container';

function Qualification({ styles }) {
  const { t } = useTranslation();
  const [domestic, setDomestic] = useState(false);

  const nextCopy = domestic ? t('continue') : t('commercial');
  const justify = domestic ? 'start' : 'space-evenly';

  return (
    <Container styles={styles}>
      <Grid container flexDirection="column">
        <Title
          styles={{
            fontSize: styles.titleSize,
            whiteSpace: styles.noWrap,
          }}
          marginBottom={styles.mb * 0.5}
          title={t('qualification')}
        />
        {domestic && (
          <Title
            marginBottom={styles.mb}
            variant="normal"
            title={t('only-commercial')}
          />
        )}
        <Grid container justifyContent={justify} maxWidth={350}>
          {!domestic && (
            <Grid>
              <Button design="reverse" onClick={() => setDomestic(true)}>
                {t('domestic')}
              </Button>
            </Grid>
          )}
          <Grid>
            <ReactLink
              to={`${BASE_URLS.SIGN_UP}/form`}
              style={{ textDecoration: 'none' }}
            >
              <Button design="reverse">{nextCopy}</Button>
            </ReactLink>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}

const QualificationStep = (props) => (
  <Wrapper Component={Qualification} {...props} />
);

export default QualificationStep;
