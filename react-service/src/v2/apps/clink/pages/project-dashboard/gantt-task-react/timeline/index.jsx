import React from 'react';
import { ViewSwitcher } from 'clink-components';
import useMuiTheme from 'v2/apps/shared/components/muiTheme';
import { useTranslation } from 'react-i18next';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

const Timeline = ({ onViewModeChange, value }) => {
  const theme = useMuiTheme('clink');
  const { palette } = theme;
  const { t } = useTranslation();
  return (
    <Paper>
      <Grid
        container
        sx={{
          border: `1px solid ${palette.panelBorder.main}`,
          borderTopRightRadius: '6px',
          borderTopLeftRadius: '6px',
        }}
      >
        <Grid item xs={6} sx={{ height: '63px' }}>
          <Typography variant="title" p={1} m={1} fontSize={22}>
            {t('timeline')}
          </Typography>
        </Grid>
        <Grid
          id="ViewSwitcher"
          sx={{
            '.lazy-load-image-background': {
              img: {
                bottom: '-5px !important',
              },
            },
          }}
          item
          container
          xs={6}
          justifyContent="flex-end"
          alignContent="center"
          pr={1}
        >
          <ViewSwitcher onViewModeChange={onViewModeChange} value={value} />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default Timeline;
