import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import CardContent from '@mui/material/CardContent';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import i18next from 'v2/helpers/i18n';
import { CONSTANTS } from 'clink-components';
import Actions from './Actions';

const { white, black, red } = CONSTANTS.colors.general;
const { transparentYellow, Seashell } = CONSTANTS.colors.prosper;

const Doc = ({
  expired = false,
  actions = [],
  variant = 'elevation',
  children,
  extra = {},
  requested: requestedDoc = false,
  updateAction = () => {},
}) => {
  const requested = requestedDoc;
  const { t } = useTranslation();
  const theme = useTheme();
  const bigDeviceResolution = useMediaQuery(theme.breakpoints.up('md'));
  let bgColor = white;
  let docActions = [...actions];
  if (requested) {
    bgColor = transparentYellow;
    docActions = bigDeviceResolution
      ? []
      : docActions.map((a) =>
          a.label === t('edit') ? { ...a, label: t('update') } : a,
        );
  } else if (expired) {
    bgColor = Seashell;
  }

  return (
    <Card
      sx={{
        width: '100%',
        minWidth: 95,
        marginBottom: '10px',
        backgroundColor: bgColor,
        ...(expired && !requested && { border: `1px solid ${red}` }),
        overflow: 'visible',
        position: 'relative',
      }}
      variant={variant}
    >
      <CardContent
        sx={{
          padding: '15px !important',
          '& .MuiBox-root': {
            ...(requested && { backgroundColor: 'transparent' }),
          },
          '& .MuiTypography-root': {
            ...(requested && { opacity: '0.5' }),
          },
          '& img': { opacity: requested ? '0.5' : '1' },
        }}
      >
        <Grid
          container
          rowSpacing={1}
          columnSpacing={{ xs: 1, sm: 2, md: 3 }}
          sx={{
            position: 'relative',
            flexWrap: 'nowrap',
            wordBreak: 'break-all',
            ...extra,
          }}
        >
          {children}
          {requested && bigDeviceResolution && (
            <Grid
              item
              xs={5}
              sx={{ display: 'flex', alignItems: 'center', pl: '0 !important' }}
            >
              <Button
                onClick={updateAction}
                sx={{
                  color: black,
                  backgroundColor: white,
                  p: '6px 14px 2px',
                  '&:hover': {
                    backgroundColor: white,
                  },
                }}
              >
                {i18next.t('update')}
              </Button>
            </Grid>
          )}
          {Boolean(docActions.length) && <Actions actions={docActions} />}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default Doc;
