import React from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Grid from '@mui/material/Grid';
import Grid2 from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import { CONSTANTS } from 'clink-components';
import parseCurrency from 'v2/helpers/currency';
import i18next from 'v2/helpers/i18n';
import { expiredDate } from 'v2/helpers/date';
import ExpirationDate from 'v2/apps/clink/pages/supply-chain-profile/prequalification/ExpirationDate';
import { commonSx } from './styles';
import {
  SCHEDULE_INDEMNITY,
  SCHEDULE_LIABILITY,
} from 'v2/helpers/prequal/documents';
import ExtraDoc from './ExtraDoc';
import Wrapper from './Wrapper';

const { bostonRed, transparentGray, white, black, clinkGreen } =
  CONSTANTS.colors.general;

const InsuranceData = ({ data, aid, country }) => {
  const currencySymbol =
    country?.code?.includes('NZ') || country?.code?.includes('AUS')
      ? i18next.t('dollar')
      : i18next.t('pound');

  const labelGreen = parseCurrency(data.price) ? clinkGreen : transparentGray;

  return (
    <>
      <Grid
        item
        xs={12}
        container
        justifyContent={{ xs: 'flex-start', lg: 'center' }}
        sx={{
          flexBasis: { xs: '50%', lg: '100%' },
        }}
      >
        <Wrapper data={data} aid={aid}>
          <Grid2 id="grid-for-insurance" container flexDirection="column">
            <Grid2>
              <Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: '16px',
                      display: { lg: 'none' },
                    }}
                  >
                    Value:
                  </Typography>
                </Box>
                <Box
                  sx={{
                    ...commonSx,
                    backgroundColor: {
                      xs: white,
                      lg: expiredDate(new Date(data.date))
                        ? bostonRed
                        : labelGreen,
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: '16px', lg: '15px' },
                      color: { xs: black, lg: white },
                      fontWeight: { xs: 100, lg: 'bold' },
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        fontSize: '20px',
                        fontWeight: 300,
                        color: 'inherit',
                        pr: 1,
                      }}
                    >
                      {currencySymbol}
                    </Typography>
                    {parseCurrency(data.price) || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Grid2>
            {[SCHEDULE_INDEMNITY, SCHEDULE_LIABILITY].includes(data?.label) &&
              data?.extra?.length &&
              !expiredDate(new Date(data.date)) && (
                <Grid2 spacing={1} container>
                  <Grid2 size={4}>
                    <Tooltip
                      title={i18next.t('certificate')}
                      placement="bottom"
                      arrow
                      sx={{ mr: 1 }}
                    >
                      <Chip
                        sx={{ width: '100%', height: 8, cursor: 'help' }}
                        color="success"
                        variant="filled"
                      />
                    </Tooltip>
                  </Grid2>
                  {data?.extra?.map((item) => {
                    return (
                      <Grid2 key={item.id} size={4}>
                        <ExtraDoc item={item} aid={aid} data={data} />
                      </Grid2>
                    );
                  })}
                </Grid2>
              )}
          </Grid2>
        </Wrapper>
      </Grid>
      <Grid
        item
        xs={12}
        sx={{
          flexBasis: { xs: '50%', lg: '100%' },
          '& .MuiTypography-root': {
            display: { xs: 'block', lg: 'unset' },
            fontSize: { xs: '16px', lg: '10px' },
          },
        }}
      >
        <ExpirationDate
          expirationDateFontSize="10px"
          expirationFontSize="10px"
          expirationColor={bostonRed}
          expirationDateColor={bostonRed}
          date={data.date}
        />
      </Grid>
    </>
  );
};
export default InsuranceData;
