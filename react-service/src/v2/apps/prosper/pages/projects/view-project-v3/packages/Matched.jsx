import React from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { renderHtmlInText } from 'v2/helpers/data';
import { useTranslation } from 'react-i18next';

import Settings from './Settings';
import PackCard from './Card';

const Matched = ({
  project,
  subcontractor,
  unlocked = false,
  open,
  handleRegister,
}) => {
  const { t } = useTranslation();
  if (!project || (project && !project.packages)) {
    return null;
  }
  const matches = project.packages.filter((card) => card.matched);
  const label = matches.length === 1 ? 'interest-result' : 'interest-results';
  const result = t(label, { count: matches.length });
  return (
    <>
      <Grid
        container
        item
        mb={1}
        display={{
          xs: 'initial',
          md: 'none',
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {t('label-packages')}
        </Typography>
      </Grid>
      <Grid container item mb={2}>
        <Settings text={renderHtmlInText(result)} />
      </Grid>
      <Grid
        container
        item
        flexWrap="wrap"
        justifyContent="flex-start"
        spacing={2}
        mb={3}
      >
        {matches.map((card) => (
          <Grid key={card.id} item md={4} sm={6} xs={12}>
            <PackCard
              pack={card}
              subcontractor={subcontractor}
              handleRegister={handleRegister}
              unlocked={unlocked}
              open={open}
            />
          </Grid>
        ))}
      </Grid>
    </>
  );
};

export default Matched;
