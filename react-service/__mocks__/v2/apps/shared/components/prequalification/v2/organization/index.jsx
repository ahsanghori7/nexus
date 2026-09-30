import React from 'react';

const Organization = ({ tabs, contextType, countryCode, hideActionButtonsInTabs, percentComplete }) => (
  <div
    data-testid="organization-component"
    contextType={contextType}
    countryCode={countryCode}
    hideActionButtonsInTabs={hideActionButtonsInTabs}
    percentComplete={percentComplete}
    tabs={tabs}
  >
    Organization Component
  </div>
);

export default Organization;
