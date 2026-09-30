import React from 'react';

const Tabs = ({ tabs, block, hideActionButtonsInTabs, percentComplete, showPercent, countryCode, contextType }) => (
  <div
    data-testid="tabs-component"
    data-percent-complete={percentComplete}
    data-show-percent={showPercent}
    data-country-code={countryCode}
    data-context-type={contextType}
    data-block={block}
    data-hide-action-buttons={hideActionButtonsInTabs && hideActionButtonsInTabs.join(',')}
  >
    {tabs && tabs.map((tab, index) => (
      <div key={index} data-testid={`tab-title-${index + 1}`}>
        {tab.title}
      </div>
    ))}
  </div>
);

export default Tabs;
