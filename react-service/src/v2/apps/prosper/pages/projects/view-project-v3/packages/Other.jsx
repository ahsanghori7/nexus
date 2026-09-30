import React from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';

import PackCard from './Card';
import Settings from './Settings';

const Other = ({
  project,
  subcontractor,
  unlocked = false,
  handleRegister,
}) => {
  const { t } = useTranslation();
  if (!project || (project && !project.packages)) {
    return null;
  }
  return (
    <>
      <Grid
        container
        item
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
          {t('label-other-packages')}
        </Typography>
      </Grid>
      <Grid container item mb={2}>
        <Settings text={t('other-interest-result')} />
      </Grid>
      <Grid
        container
        item
        flexWrap="wrap"
        justifyContent="flex-start"
        spacing={2}
      >
        {project &&
          project.packages.map((card) => {
            const { matched } = card;
            if (matched) {
              return null;
            }
            return (
              <Grid key={card.id} item md={4} sm={6} xs={12}>
                <PackCard
                  unlocked={unlocked}
                  pack={card}
                  handleRegister={handleRegister}
                  subcontractor={subcontractor}
                  hideRegister
                  showStatus
                />
              </Grid>
            );
          })}
      </Grid>
    </>
  );
};

export default Other;
