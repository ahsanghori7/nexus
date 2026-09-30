import React, { useEffect } from 'react';
import capitalize from 'lodash/capitalize';
import { Button, Feed } from 'clink-components';
import { useTranslation } from 'react-i18next';
import { useContext } from 'hooks/context';
import { goTo, getBaseUrl } from 'v2/helpers/url';
import Loading from 'v2/apps/shared/components/Loading';
import OpportunityCard from 'v2/apps/shared/components/cards/small/OpportunityCard';
import Typography from '@mui/material/Typography';
import MuiButton from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { Link as ReactLink } from 'react-router-dom';
import EnquiryCard from 'v2/apps/shared/components/cards/small/EnquiryCard';
import EmptyFeed from '../empty-feed';
import { StyledContent, StyledFooter } from './Dashboard.styled';

const grid = (opportunities, enquiries, subcontractor, dispatch) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useTranslation();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const context = useContext(BASE_DIRS.V2.PROSPER);
  const { actions } = context;
  const { latest: latestOpportunities, status: statusOpportunities } =
    opportunities;
  const { latest: latestEnquiries, status: statusEnquiries } = enquiries;
  const emptyAssets =
    !subcontractor ||
    !subcontractor.regions ||
    !subcontractor.trades ||
    !Object.values(subcontractor.trades).length ||
    !Object.values(subcontractor.regions).length;

  const emptyOpportunities =
    !statusOpportunities &&
    (!latestOpportunities ||
      (latestOpportunities && !latestOpportunities.length));

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    Promise.all([dispatch(actions.fetchEnquiries({ limit: 10 }))]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeItem = (cardItem) => {
    if (!cardItem.restricted) {
      dispatch(actions.saveLatestOnLocal(cardItem));
    }
  };
  const goToEnquiries = () => goTo(`${BASE_URLS.PROSPER}/projects/enquiries`);

  const emptyEnquiries =
    !statusEnquiries &&
    (!latestEnquiries || (latestEnquiries && !latestEnquiries.length));

  return [
    {
      key: { one: true },
      title: t(emptyAssets ? 'find-opportunities' : 'your-matched-projects'),
      content: (
        <>
          {emptyOpportunities && (
            <StyledContent
              stories
              style={{ minHeight: emptyAssets ? '160px' : '100px' }}
            >
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
                          : 'no-opportunities-message-3',
                      )}
                    </Typography>
                  </Grid>
                  {emptyAssets && (
                    <Grid item mt={1} width="100%">
                      <ReactLink
                        to="/projects/opportunity-viewer"
                        style={{ textDecoration: 'none' }}
                      >
                        <MuiButton design="red" sx={{ width: '100%' }}>
                          {t('discover-opportunities')}
                        </MuiButton>
                      </ReactLink>
                    </Grid>
                  )}
                </Grid>
              )}
            </StyledContent>
          )}
          {!emptyOpportunities && (
            <StyledContent height={384} marginBottom={-30}>
              <Feed theme="prosper-dashboard" maxHeight={384}>
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
              </Feed>
            </StyledContent>
          )}
        </>
      ),
    },
    {
      key: { four: true },
      title: t('enquiries'),
      content: (
        <>
          {emptyEnquiries && <EmptyFeed type="enquiries" />}
          {!emptyEnquiries && (
            <StyledContent height={484} hasFooter>
              <Feed theme="prosper-dashboard" maxHeight={464}>
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
              </Feed>
              <StyledFooter>
                {!statusEnquiries &&
                  latestEnquiries &&
                  Boolean(latestEnquiries.length) && (
                    <Button
                      color="prosperButton"
                      sizeBtn="normal"
                      layout="square"
                      disabled={Boolean(statusEnquiries)}
                      handleClick={goToEnquiries}
                    >
                      {capitalize(t('text-see-all-enquiries'))}
                    </Button>
                  )}
              </StyledFooter>
            </StyledContent>
          )}
        </>
      ),
    },
  ];
};

export default grid;
