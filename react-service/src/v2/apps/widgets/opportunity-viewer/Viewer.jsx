import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import SelectDialog from 'v2/apps/shared/components/select';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { Box } from '@mui/material';
import isNil from 'lodash/isNil';
import { useTranslation } from 'react-i18next';
import { Link as ReactLink } from 'react-router-dom';
import { goTo } from 'v2/helpers/url';
import { UK } from 'v2/helpers/region';
import { hasCookie } from './config';
import hooks from './hooks';

function Viewer({
  show = true,
  discover = false,
  title,
  opportunity,
  subcontractor,
  dispatch,
  context = BASE_DIRS.V2.PROSPER,
  idRegion = UK.id,
  attributes,
}) {
  const id = subcontractor?.id;
  const {
    trades,
    setTrades,
    regions,
    setRegions,
    initialOption,
    handleSubmit,
    showOpportunities,
    setShowOpportunities,
  } = hooks({
    discover,
    show,
    subcontractor,
    idRegion,
    dispatch,
    id,
    attributes,
  });
  const { t } = useTranslation();

  const { opportunities: projects } = opportunity;
  const hasOpportunity = opportunity && Boolean(opportunity.opportunities);
  const showOpportunity =
    showOpportunities &&
    trades &&
    Boolean(trades.length) &&
    regions &&
    Boolean(regions.length);
  const { regions: regionsOptions, trades: tradesOptions } = attributes;

  const hasInfo =
    subcontractor?.id && tradesOptions?.length && regionsOptions?.length;

  useEffect(() => {
    if (hasOpportunity && showOpportunity) {
      goTo('/projects/find-opportunities');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOpportunities]);

  const handleClick =
    show && discover
      ? () => {
          handleSubmit();
          setShowOpportunities(true);
        }
      : () => null;

  const setter = (set) => (options) => {
    set(options);
    setShowOpportunities(!discover);
  };

  const propsButton = {};
  if (discover && show) {
    propsButton.width = '100%';
  }

  return (
    <>
      <Typography
        id="opportunity-title-1"
        data-testid="opportunity-title-1"
        variant="boldTitle"
        textAlign="center"
        sx={{ fontSize: { xs: '18pt', md: '24px' } }}
      >
        {title}
      </Typography>
      <Box
        sx={{ marginTop: { xs: 2, md: 2, lg: 2 } }}
        flex={1}
        id="opportunity-autocomple-1"
        data-testid="opportunity-autocomple-1"
      >
        <SelectDialog
          title={t('trades-placeholder', {
            interpolation: { escapeValue: false },
          })}
          options={tradesOptions}
          setter={setter(setTrades)}
          hasCookie={hasCookie}
          name="trades"
          placeholder={t('find-trade-placeholder', {
            interpolation: { escapeValue: false },
          })}
          initialOption={initialOption}
          context={context}
        />
      </Box>
      <Box
        sx={{ marginTop: 2 }}
        flex={1}
        id="opportunity-autocomple-2"
        data-testid="opportunity-autocomple-2"
      >
        <SelectDialog
          title={t('regions-placeholder', {
            interpolation: { escapeValue: false },
          })}
          options={regionsOptions}
          setter={setter(setRegions)}
          hasCookie={hasCookie}
          name="regions"
          placeholder={t('find-location-placeholder', {
            interpolation: { escapeValue: false },
          })}
          initialOption={initialOption}
          context={context}
        />
      </Box>
      {hasOpportunity && showOpportunity && !(discover && show) && (
        <Grid
          container
          mt={1}
          p={1}
          id="opportunity-result-container-success"
          data-testid="opportunity-result-container-success"
        >
          <Grid
            id="opportunity-result-item-success-2"
            data-testid="opportunity-result-item-success-2"
            item
            xs={12}
          >
            <Grid container>
              <Grid item display="flex" alignItems="center">
                <Typography
                  color="error"
                  variant="widget2"
                  component="p"
                  sx={{ fontSize: { xs: '40px', md: '56px', lg: '56px' } }}
                >
                  {projects}
                </Typography>
                <Typography
                  variant="widget1"
                  component="p"
                  sx={{
                    whiteSpace: 'nowrap',
                    fontSize: {
                      xs: '18pt',
                      md: '28px',
                      lg: '28px',
                    },
                    marginLeft: 2,
                  }}
                >
                  {t('packages-available')}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}
      {!hasOpportunity && showOpportunity && !isNil(projects) && (
        <Grid
          container
          p={1}
          textAlign="justify"
          lineHeight={1}
          id="opportunity-result-container-error"
        >
          <Grid id="opportunity-result-item-error-1" item>
            <Typography
              variant="title2"
              component="p"
              sx={{ fontSize: '14pt', lineHeight: 1.25 }}
            >
              {t('no-opportunity-1-design')}
            </Typography>
            <Typography
              variant="boldTitle"
              component="p"
              sx={{ fontSize: '14pt', lineHeight: 1.25, marginTop: 1 }}
            >
              {t('no-opportunity-2-design-no-newsletter')}
            </Typography>
          </Grid>
        </Grid>
      )}
      {showOpportunity &&
        show &&
        !discover &&
        (hasOpportunity || (!hasOpportunity && !isNil(projects))) && (
          <Grid
            container
            p={1}
            textAlign="justify"
            lineHeight={1}
            id="opportunity-signup"
            data-testid="opportunity-signup"
            sx={{ width: '100%' }}
          >
            <Grid item {...propsButton} sx={{ width: '100%' }}>
              <Button
                design="red"
                sx={{ width: '100%' }}
                href={`${BASE_URLS.APP_PROSPER}/sign-up?src=opw`}
              >
                {t('sign-up')}
              </Button>
            </Grid>
          </Grid>
        )}
      {discover && (
        <Grid
          container
          p={1}
          textAlign="justify"
          lineHeight={1}
          id="opportunity-discover"
          data-testid="opportunity-discover"
        >
          <Grid item mt={1} {...propsButton}>
            <ReactLink
              to={!hasInfo || show ? '#' : '/projects/find-opportunities'}
              style={{ textDecoration: 'none' }}
              onClick={handleClick}
            >
              <Button design="red" disabled={!hasInfo} sx={{ width: '100%' }}>
                {t('discover-opportunities')}
              </Button>
            </ReactLink>
          </Grid>
        </Grid>
      )}
    </>
  );
}
const mapStateToProps = (state) => ({
  subcontractor: state.subcontractor,
  opportunity: state.opportunityViewer.opportunity,
  attributes: state.attributes,
});

export default connect(mapStateToProps)(Viewer);
