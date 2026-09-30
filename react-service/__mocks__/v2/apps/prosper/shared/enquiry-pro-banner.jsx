import React from 'react';

const EnquiryProBanner = ({
  show = false,
  opportunities = 0,
  subcontractor = {},
  closeBanner = () => {},
  upgradeProsperPro = () => {},
  ...props
}) => {
  if (!show) return null;

  return (
    <div data-testid="enquiry-pro-banner-mock">
      <div>Opportunities: {opportunities}</div>
      <button onClick={closeBanner} data-testid="close-banner">
        Close Banner
      </button>
      <button onClick={upgradeProsperPro} data-testid="upgrade-prosper-pro">
        Upgrade to Prosper Pro
      </button>
    </div>
  );
};

export default EnquiryProBanner;
