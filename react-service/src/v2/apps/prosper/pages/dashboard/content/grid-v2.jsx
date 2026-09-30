import React, { useEffect } from 'react';
import capitalize from 'lodash/capitalize';
import { CONSTANTS } from 'clink-components';
import { useTranslation } from 'react-i18next';
import { useContext } from 'hooks/context';
import { goTo, getBaseUrl } from 'v2/helpers/url';
import ProsperCarousel from 'v2/apps/prosper/shared/carousel';
import Loading from 'v2/apps/shared/components/Loading';
import OpportunityCard from 'v2/apps/shared/components/cards/small/OpportunityCard';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import MuiButton from '@mui/material/Button';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import { Link as ReactLink } from 'react-router-dom';
import EnquiryCard from 'v2/apps/shared/components/cards/small/EnquiryCardV2';
import EmptyFeed from '../empty-feed';
import { PinkHighlight } from './Dashboard.styled';
import SuccessSlide from './SuccessSlide';
import ResourcesSlide from './ResourcesSlide';

const { fog } = CONSTANTS.colors.prosper;
const { white } = CONSTANTS.colors.general;

const useGrid = (opportunities, enquiries, subcontractor, dispatch) => {
  const { t } = useTranslation();
  const context = useContext(BASE_DIRS.V2.PROSPER);
  const { actions } = context;
  const { latest: latestOpportunities, status: statusOpportunities } =
    opportunities;
  const { latest: latestEnquiries, status: statusEnquiries } = enquiries;

  const isANZMessage = 'no-opportunities-message-2';

  useEffect(() => {
    dispatch(actions.fetchOpportunities());
    dispatch(actions.fetchEnquiries({ limit: 10 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeItem = (cardItem) => {
    if (!cardItem.restricted) {
      dispatch(actions.saveLatestOnLocal(cardItem));
    }
  };
  const goToEnquiries = () => goTo(`${BASE_URLS.PROSPER}/projects/enquiries`);

  const emptyOpportunities =
    !statusOpportunities &&
    (!latestOpportunities ||
      (latestOpportunities && !latestOpportunities.length));
  const emptyEnquiries =
    !statusEnquiries &&
    (!latestEnquiries || (latestEnquiries && !latestEnquiries.length));
  const emptyAssets =
    !subcontractor ||
    !subcontractor.regions ||
    !subcontractor.trades ||
    !Object.values(subcontractor.trades).length ||
    !Object.values(subcontractor.regions).length;

  return [
    {
      key: { one: true },
      title: t(emptyAssets ? 'find-opportunities' : 'your-matched-projects'),
      content: (
        <>
          {emptyOpportunities && (
            <Card id="card-empty-opportunities" sx={{ minWidth: 275 }}>
              <CardContent>
                {Boolean(subcontractor.id) && (
                  <Grid container pl={3} pr={3}>
                    <Grid item width="100%">
                      <Typography
                        variant="boldTitle"
                        component="p"
                        sx={{ fontSize: '14pt', lineHeight: 1.25 }}
                      >
                        {t(
                          emptyAssets
                            ? 'no-opportunities-message-1'
                            : isANZMessage,
                        )}
                        {!emptyAssets && (
                          <ReactLink
                            to="/resources"
                            component={Link}
                            color="secondary"
                          >
                            {t('resources').toLowerCase()}
                          </ReactLink>
                        )}
                      </Typography>
                    </Grid>
                  </Grid>
                )}
              </CardContent>
              <CardActions>
                {emptyAssets && (
                  <Grid item mt={1} width="100%" sx={{ textAlign: 'center' }}>
                    <ReactLink
                      to="/projects/opportunity-viewer"
                      style={{ textDecoration: 'none' }}
                    >
                      <MuiButton
                        color="secondary"
                        variant="contained"
                        size="large"
                      >
                        {t('discover-opportunities')}
                      </MuiButton>
                    </ReactLink>
                  </Grid>
                )}
              </CardActions>
            </Card>
          )}
          {!emptyOpportunities && (
            <Card id="card-opportunities" sx={{ minWidth: 275 }}>
              <CardContent sx={{ maxHeight: 500, overflowY: 'scroll' }}>
                <Loading status={statusOpportunities} />
                {!statusOpportunities &&
                  latestOpportunities &&
                  Boolean(latestOpportunities.length) &&
                  latestOpportunities.map((item) => (
                    <OpportunityCard
                      key={item.id}
                      item={item}
                      onDelete={removeItem}
                    />
                  ))}
              </CardContent>
            </Card>
          )}
        </>
      ),
    },
    {
      key: { two: true },
      title: (
        <>
          {t('resources')}
          {' - '}
          <PinkHighlight>
            {t('text-tender-return')} {t('template').toLowerCase()}
          </PinkHighlight>
        </>
      ),
      content: (
        <Card
          id="card-resources"
          sx={{
            minWidth: 275,
            background: `transparent linear-gradient(180deg, ${white} 75%, ${fog} 100%) 0% 0% no-repeat padding-box`,
          }}
        >
          <CardContent>
            <ResourcesSlide />
          </CardContent>
        </Card>
      ),
    },
    {
      key: { three: true },
      title: t('success-stories'),
      content: (
        <Card
          id="card-success-stories"
          sx={{
            minWidth: 275,
            background: `transparent linear-gradient(180deg, ${white} 75%, ${fog} 100%) 0% 0% no-repeat padding-box`,
          }}
        >
          <CardContent>
            <ProsperCarousel
              carouselProps={{
                showThumbs: false,
                showStatus: false,
                centerMode: false,
                showIndicators: false,
                renderArrowPrev: () => null,
                renderArrowNext: () => null,
              }}
            >
              <SuccessSlide />
            </ProsperCarousel>
          </CardContent>
        </Card>
      ),
    },
    {
      key: { four: true },
      title: t('enquiries'),
      content: (
        <>
          {emptyEnquiries && <EmptyFeed type="enquiries" />}
          {!emptyEnquiries && (
            <Card
              id="card-enquiries"
              sx={{
                minWidth: 275,
              }}
            >
              <CardContent sx={{ maxHeight: 500, overflowY: 'scroll' }}>
                <Loading status={statusEnquiries} />
                {!statusEnquiries &&
                  latestEnquiries &&
                  Boolean(latestEnquiries.length) &&
                  latestEnquiries.map((enquiry) => (
                    <EnquiryCard
                      link={`${getBaseUrl(
                        'prosper',
                      )}/projects/enquiries?enquiry_id=${enquiry.id}`}
                      key={enquiry.id}
                      item={enquiry}
                    />
                  ))}
              </CardContent>

              <CardActions sx={{ justifyContent: 'center' }}>
                {!statusEnquiries &&
                  latestEnquiries &&
                  Boolean(latestEnquiries.length) && (
                    <MuiButton
                      size="large"
                      variant="contained"
                      disabled={Boolean(statusEnquiries)}
                      onClick={goToEnquiries}
                    >
                      {capitalize(t('text-see-all-enquiries'))}
                    </MuiButton>
                  )}
              </CardActions>
            </Card>
          )}
        </>
      ),
    },
  ];
};

export default useGrid;
