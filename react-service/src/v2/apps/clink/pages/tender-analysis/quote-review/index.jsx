import React from 'react';
import Table from 'v2/apps/shared/components/boq/Table';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import i18next from 'v2/helpers/i18n';
import Wrapper from 'v2/apps/clink/pages/boq/content/Wrapper';
import Actions from 'v2/apps/clink/pages/tender-analysis/summary/actions';
import QuoteReviewTableRows, {
  Columns,
} from 'v2/apps/shared/components/boq/QuoteReviewConfig';
import parseCurrency, { currencyConfig } from 'v2/helpers/currency';
import { inputBaseSx } from 'v2/apps/clink/pages/boq/content/style';
import useTheme from 'v2/apps/shared/components/muiTheme';
import Subscription from 'v2/helpers/user/subscription';
import { getUrl } from 'v2/helpers/url';

/**
 *  Design Guidance: https://xd.adobe.com/view/60bceb6e-f76a-43b3-8b90-0b6c5bea6940-35ef/screen/ee039839-f002-4ab7-bbb1-ff794fcaa0da/
 *
 * @param quote
 * @param units
 * @param Body
 * @returns {JSX.Element}
 * @constructor
 */

const subscriptionHelper = new Subscription();

const WrapperName = ({ children, membership }) => {
  if (
    membership?.account_id &&
    membership?.subscription_id &&
    !subscriptionHelper.isExternalMin(membership?.subscription_id)
  ) {
    const url = getUrl(
      'CLINK_APP_HOST',
      `/main-contractor/supply_chain/${membership?.account_id}?return=sc`,
    );
    return (
      <a href={url} target="_blank" rel="noreferrer">
        <Typography
          sx={{
            fontSize: '32px',
            fontWeight: 600,
            mb: 3,
          }}
        >
          {children}
        </Typography>
      </a>
    );
  }
  return children;
};

const QuoteReview = ({ quote, entity, orderTemplates }) => {
  const theme = useTheme('clink');
  const palette = theme ? theme.palette : {};
  const { tender, entries } = entity;
  const { rows, summary, subcontractor } = quote;
  const { name, membership } = subcontractor;
  const pid = tender && tender.project_id;
  const awarded = tender && tender.awarded;

  const footerTextStyle = {
    fontSize: '22px',
    fontWeight: 600,
    mb: 1,
  };

  const newRows = rows.map((r) => {
    const [entry] = entries.filter(
      (e) => Number(r.boq_item_id) === Number(e.id),
    );
    if (!entry) {
      return r;
    }
    return {
      ...entry,
      ...r,
    };
  });
  return (
    <Box>
      <Wrapper>
        <Grid
          container
          sx={{
            p: 2,
            '& .MuiTableHead-root th:last-of-type': {
              display: 'none',
            },
          }}
        >
          <Grid container item justifyContent="space-between">
            <Grid item xs={7}>
              <Box>
                <WrapperName membership={membership}>{name}</WrapperName>
                <Grid container item justifyContent="space-between">
                  <Grid item>
                    <Typography sx={footerTextStyle}>
                      {i18next.t('ta-programme-weeks')}:
                    </Typography>
                    <Typography sx={footerTextStyle}>
                      {entity?.programme_weeks?.text}
                    </Typography>
                  </Grid>
                  <Grid item sx={{ flexBasis: '23%' }}>
                    <Typography sx={footerTextStyle}>
                      {i18next.t('ta-total')}:
                    </Typography>
                    <Typography sx={footerTextStyle}>
                      {summary &&
                        parseCurrency(
                          summary,
                          currencyConfig[i18next.t('currency')],
                        )}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            <Grid item sx={{ flexBasis: '200px' }}>
              <Actions
                quoteInfo={quote}
                orderTemplates={orderTemplates}
                pid={pid}
                awarded={awarded}
                entity={entity}
              />
            </Grid>
          </Grid>
          <Box sx={{ width: '100%', mb: 3 }}>
            {entity?.exclusion_note?.text && (
              <>
                <Typography sx={{ fontWeight: 'bold', mt: 1 }}>
                  {i18next.t('exclusion-notes')}:
                </Typography>
                <TextareaAutosize
                  readOnly
                  value={entity?.exclusion_note?.text}
                  style={inputBaseSx(palette, false)}
                  minRows={1}
                />
              </>
            )}
          </Box>
          <Table
            Columns={Columns}
            items={newRows}
            Body={QuoteReviewTableRows}
          />
        </Grid>
      </Wrapper>
    </Box>
  );
};

export default QuoteReview;
