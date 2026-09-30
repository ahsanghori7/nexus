import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import Subscription from 'v2/helpers/user/subscription';
import { useContext } from 'hooks/context';
import EnquiryProBanner from 'v2/apps/prosper/shared/enquiry-pro-banner';
import Cookies from 'js-cookie';
import isNil from 'lodash/isNil';
import { happenInLast24Hours } from 'v2/helpers/date';
import { getUrlWithoutParamers } from 'v2/helpers/url';

const PRO_ENQUIRY_BANNER_CLOSED = 'PRO_ENQUIRY_BANNER_CLOSED';

const subscriptionHelper = new Subscription();
const Banner = ({ subcontractor = {}, enquiries, opportunities, dispatch }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [opportunitiesCount, setOpportunitiesCount] = useState(0);
  const context = useContext(BASE_DIRS.V2.PROSPER);

  const { current: enquiriesList } = enquiries || {};
  const { projects } = opportunities || {};
  const { prosperProBanner, trades } = subcontractor;
  const { actions } = context;

  const url = getUrlWithoutParamers();
  useEffect(() => {
    if (
      subcontractor.id &&
      showBanner &&
      !url.includes('enquiries') &&
      !url.includes('dashboard')
    ) {
      dispatch(actions.fetchEnquiries());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subcontractor.id, showBanner]);

  useEffect(() => {
    if (
      subcontractor.id &&
      showBanner &&
      !url.includes('find-opportunities') &&
      !url.includes('dashboard')
    ) {
      dispatch(actions.fetchOpportunities());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subcontractor.id, showBanner]);

  useEffect(() => {
    if (subcontractor) {
      setShowBanner(subcontractor.prosperProBanner);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subcontractor.prosperProBanner, subcontractor.subscription_id]);

  useEffect(() => {
    let show = false;
    if (
      prosperProBanner &&
      subscriptionHelper.isActivatedSupplyChain(subcontractor.subscription_id)
    ) {
      const lastTimeBannerClosed = Cookies.get(PRO_ENQUIRY_BANNER_CLOSED);
      show =
        isNil(lastTimeBannerClosed) ||
        !happenInLast24Hours(lastTimeBannerClosed);
    }
    setShowBanner(show);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enquiriesList]);

  useEffect(() => {
    if (projects) {
      let nMatches = projects.flatMap((project) => {
        const { tenders } = project;
        return tenders.flatMap((tender) => {
          const { packages } = tender;
          const newPacks = packages.filter((p) => !isNaN(p));
          const packagesResult = newPacks.filter((check) =>
            Object.keys(trades || {}).map(Number).includes(check)
          );
          return packagesResult.length ? tender : null;
        });
      });
      nMatches = nMatches.filter((match) => match);
      nMatches = nMatches.filter(
        (tender) => !tender.registered || !tender.awarded
      );
      setOpportunitiesCount(nMatches.length);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  const handleCloseBanner = () => {
    const currentDate = new Date();
    Cookies.set(PRO_ENQUIRY_BANNER_CLOSED, currentDate.valueOf());
    setShowBanner(false);
  };

  const handleUpgradeProsperPro = () =>
    dispatch(actions.upgradeProsperPro()).then(() =>
      dispatch(actions.fetchSubcontractorInfo())
    );
  return Boolean(opportunitiesCount) ? (
    <EnquiryProBanner
      show={showBanner}
      opportunities={opportunitiesCount}
      subcontractor={subcontractor}
      closeBanner={handleCloseBanner}
      upgradeProsperPro={handleUpgradeProsperPro}
    />
  ) : null;
};

const mapStateToProps = (state) => {
  return {
    enquiries: state.enquiries,
    opportunities: state.opportunities,
    subcontractor: state.subcontractor,
  };
};

export default connect(mapStateToProps)(Banner);
