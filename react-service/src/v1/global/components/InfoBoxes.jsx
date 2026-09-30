import React from 'react';
import IconHelpInfo from '../public/images/svg/icon-help-info.svg';

const HelpBox = (props) => {
  const { companyAssets } = props;

  return (
    <div className={`help-box ${companyAssets ? 'company-assets-box' : ''}`}>
      <div className="help-box-icon">
        <IconHelpInfo />
      </div>
      <div className="help-box-title">
        <span>Help</span>
      </div>
    </div>
  );
};

const InfoBox = (props) => {
  const { infoText, companyAssets } = props;

  return (
    <div className={`info-box ${companyAssets ? 'company-assets-box' : ''}`}>
      <span>{infoText}</span>
    </div>
  );
};

export { HelpBox, InfoBox };
