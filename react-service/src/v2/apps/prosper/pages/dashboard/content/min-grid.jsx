import React, { useEffect } from 'react';
import capitalize from 'lodash/capitalize';
import { Button, Feed } from 'clink-components';
import { useTranslation } from 'react-i18next';
import { useContext } from 'hooks/context';
import { goTo, getBaseUrl } from 'v2/helpers/url';
import Loading from 'v2/apps/shared/components/Loading';
import EnquiryCard from 'v2/apps/shared/components/cards/small/EnquiryCard';
import EmptyFeed from '../empty-feed';
import { StyledContent, StyledFooter } from './Dashboard.styled';

const grid = (enquiries, dispatch) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useTranslation();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const context = useContext(BASE_DIRS.V2.PROSPER);
  const { actions } = context;
  const { latest: latestEnquiries, status: statusEnquiries } = enquiries;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    Promise.all([dispatch(actions.fetchEnquiries({ limit: 10 }))]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToEnquiries = () => goTo(`${BASE_URLS.PROSPER}/projects/enquiries`);

  const emptyEnquiries =
    !statusEnquiries &&
    (!latestEnquiries || (latestEnquiries && !latestEnquiries.length));

  return [
    {
      key: { one: true },
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
