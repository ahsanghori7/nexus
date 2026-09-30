import React, { useMemo } from 'react';
import moment from 'moment';
import { CONSTANTS } from 'clink-components';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { getDateValuesV1 } from 'v2/helpers/date';
import pennyToCurrency from 'v2/helpers/currency/v1';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import { getAccountLogo } from 'v2/helpers/user';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { useTranslation } from 'react-i18next';
import flag from 'v2/helpers/flags';

const { darkCharcoal, eerieBlack } = CONSTANTS.colors.general;
const { proxima } = CONSTANTS.fonts;

const DocHeader = ({ meta }) => {
  const { t } = useTranslation();
  const {
    quote = {},
    values = {},
    approvers = [],
    has_tender_recommendation: hasTR = false,
  } = meta || {};

  const orderNumber = quote?.order_number ?? 'N/A';
  const datetime = quote?.order_updated
    ? quote.order_updated
    : quote?.quote_created;
  const company = quote?.subcontractor?.name ?? 'N/A';
  const status = quote?.status ?? 'N/A';
  const value =
    pennyToCurrency(values?.order_value || (hasTR ? quote?.forecast : null)) ?? 'N/A';

  const company_logo = useMemo(
    () => getAccountLogo(quote?.subcontractor?.id, true),
    [quote?.subcontractor?.id],
  );

  const approval_needed = useMemo(
    () => approvers && approvers.length > 0,
    [approvers],
  );

  const date = useMemo(() => {
    if (datetime) {
      const [dateOnly] = datetime.split(' ');
      const formattedDate = getDateValuesV1(dateOnly);
      return moment(formattedDate).format('DD/MM/YYYY');
    }
    return 'N/A';
  }, [datetime]);

  const items = useMemo(
    () => [
      { title: 'Order Number', value: orderNumber, xs: 2 },
      { title: 'Date', value: date, xs: 2 },
      { title: 'Company', value: company, xs: 4 },
      { title: 'Value', value, xs: 2 },
      { title: 'Status', value: status, xs: 2 },
    ],
    [orderNumber, date, company, value, status],
  );

  return (
    <Paper sx={{ padding: 4 }}>
      <Grid container spacing={2}>
        {items.map((item) => (
          <Grid item xs={item.xs} key={item.title}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: item.title === 'Company' ? 'flex-start' : 'center',
              }}
            >
              {item.title === 'Company' && (
                <Avatar
                  src={company_logo}
                  alt={company}
                  sx={{
                    width: 40,
                    height: 40,
                    marginBottom: 1,
                    marginRight: 1,
                  }}
                />
              )}
              <Box>
                <Typography
                  sx={{ fontFamily: proxima, fontSize: 14 }}
                  color={darkCharcoal}
                >
                  {item.title}
                </Typography>
                <Typography
                  sx={{ fontFamily: proxima, fontSize: 14 }}
                  color={eerieBlack}
                  fontWeight="600"
                >
                  {item.value}
                </Typography>
                {flag('APPROVAL_THRESHOLD') &&
                  approval_needed &&
                  item.title === 'Value' && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        marginTop: 1,
                      }}
                    >
                      <Tooltip title={t('approval-needed-tooltip')}>
                        <IconButton sx={{ padding: 0, marginRight: 0.5 }}>
                          <InfoOutlined sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>

                      <Typography
                        sx={{ fontFamily: proxima, fontSize: 12 }}
                        color={eerieBlack}
                        fontWeight="600"
                      >
                        {t('approval-needed')}
                      </Typography>
                    </Box>
                  )}
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default DocHeader;
