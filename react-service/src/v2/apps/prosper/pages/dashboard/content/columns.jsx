import React, { useEffect } from 'react';
import capitalize from 'lodash/capitalize';
import { Button, Feed } from 'clink-components';
import { useTranslation } from 'react-i18next';
import { useContext } from 'hooks/context';
import { goTo } from 'v2/helpers/url';
import Loading from 'v2/apps/shared/components/Loading';
import OpportunityCard from 'v2/apps/shared/components/cards/small/OpportunityCard';
import EnquiryCard from 'v2/apps/shared/components/cards/small/EnquiryCard';
import EmptyFeed from '../empty-feed';
import { StyledContent, StyledFooter } from './Dashboard.styled';

const useColumns = (opportunities, enquiries, _, dispatch) => {
  const { t } = useTranslation();
  const context = useContext(BASE_DIRS.V2.PROSPER);
  const { actions } = context;
  const { latest: latestOpportunities, status: statusOpportunities } =
    opportunities;
  const { latest: latestEnquiries, status: statusEnquiries } = enquiries;

  useEffect(() => {
    Promise.all([
      dispatch(actions.fetchOpportunities()),
      dispatch(actions.fetchEnquiries({ limit: 10 })),
    ]);
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

  return [
    {
      key: { one: true },
      title: t('latest-opportunities'),
      content: (
        <>
          {emptyOpportunities && <EmptyFeed type="opportunities" />}
          {!emptyOpportunities && (
            <StyledContent>
              <Feed theme="prosper-dashboard">
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
      key: { two: true },
      title: t('enquiries'),
      content: (
        <>
          {emptyEnquiries && <EmptyFeed type="enquiries" />}
          {!emptyEnquiries && (
            <StyledContent hasFooter>
              <Feed theme="prosper-dashboard" maxHeight={534}>
                <Loading status={statusEnquiries} />
                {!statusEnquiries &&
                  latestEnquiries &&
                  Boolean(latestEnquiries.length) &&
                  latestEnquiries.map((enquiry) => (
                    <EnquiryCard key={enquiry.id} item={enquiry} />
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

export default useColumns;
