import React, { useState } from 'react';
import Grid from '@mui/material/Grid2';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import { Link as ReactLink } from 'react-router-dom';
import Wrapper from 'v2/apps/prosper/pages/sign-up/shared/Wrapper';
import Title from 'v2/apps/prosper/pages/sign-up/shared/Title';
import Container from 'v2/apps/prosper/pages/sign-up/shared/Container';
import { NZ, AUS } from 'v2/helpers/region';

function ANZQualification({ styles, codeRegion, setCodeRegion }) {
  const { t } = useTranslation();
  const [domestic, setDomestic] = useState(false);

  const checkRegion = (code) => (codeRegion?.code === code ? 'red' : 'reverse');

  const nextCopy = domestic ? t('continue') : t('commercial');
  const justify = domestic ? 'start' : 'space-evenly';

  const disabledForNZ = !codeRegion;
  return (
    <Container styles={styles}>
      <Grid container flexDirection="column" sx={{ mb: styles.bottomMt * 2 }}>
        <Title
          styles={{
            fontSize: styles.titleSize,
            whiteSpace: styles.noWrap,
          }}
          marginBottom={styles.mb * 0.5}
          title={t('which-country')}
        />
        <Grid container justifyContent={justify} maxWidth={350} gap={2}>
          <Grid>
            <Button
              design={checkRegion(NZ.code)}
              onClick={() => setCodeRegion(NZ)}
            >
              {NZ.name}
            </Button>
          </Grid>
          <Grid>
            <Button
              design={checkRegion(AUS.code)}
              onClick={() => setCodeRegion(AUS)}
            >
              {AUS.name}
            </Button>
          </Grid>
        </Grid>
      </Grid>
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
        <Grid container mt={0} justifyContent={justify} maxWidth={350}>
          {!domestic && (
            <Grid item>
              <Button
                design="reverse"
                onClick={() => setDomestic(true)}
                disabled={disabledForNZ}
              >
                {t('domestic')}
              </Button>
            </Grid>
          )}
          <Grid item>
            {disabledForNZ ? (
              <Button design="reverse" disabled>
                {nextCopy}
              </Button>
            ) : (
              <ReactLink
                to={`${BASE_URLS.SIGN_UP}/form`}
                style={{ textDecoration: 'none' }}
              >
                <Button design="reverse">{nextCopy}</Button>
              </ReactLink>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}

const QualificationStep = (props) => (
  <Wrapper Component={ANZQualification} {...props} />
);

export default QualificationStep;
