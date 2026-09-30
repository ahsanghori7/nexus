// Mock for prequalification v2 components
import React from 'react';

// Mock Tabs component
export const Tabs = ({ tabs, block, percentComplete, children, ...props }) => (
  <div data-testid="tabs-component" data-percent-complete={percentComplete} data-blocked={block}>
    {tabs && tabs.map((tab) => (
      <div key={tab.id} data-testid={`tab-${tab.id}`}>
        <div data-testid={`tab-title-${tab.id}`}>{tab.title}</div>
        {tab.Content && (
          <div data-testid={`tab-content-${tab.id}`}>
            <tab.Content />
          </div>
        )}
      </div>
    ))}
    {children}
  </div>
);

// Mock Documents component
export const Documents = (props) => (
  <div data-testid="documents-component" {...props}>
    Documents Component
  </div>
);

// Mock References component
export const References = (props) => (
  <div data-testid="references-component" {...props}>
    References Component
  </div>
);

// Mock Finance component
export const Finance = (props) => (
  <div data-testid="finance-component" {...props}>
    Finance Component
  </div>
);

// Mock Organization component
export const Organization = (props) => (
  <div data-testid="organization-component" {...props}>
    Organization Component
  </div>
);

// Mock ProgressBar component
export const ProgressBar = ({ percentComplete }) => (
  <div data-testid="progress-bar" data-percent-complete={percentComplete}>
    Progress: {percentComplete}%
  </div>
);

export default {
  Tabs,
  Documents,
  References,
  Finance,
  Organization,
  ProgressBar,
};
