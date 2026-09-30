import React from 'react';
import { connect } from 'react-redux';
import { Tabs as TabsComponent } from 'clink-components';
import clinkTabs from 'v2/apps/admin/pages/clink/Accounts/tabs';
import prosperTabs from 'v2/apps/admin/pages/prosper/Accounts/tabs';
import featuresTabs from 'v2/apps/admin/pages/clink/Features/tabs';

const DataContent = ({ company, engagement, features, tabs, contextType }) => {
  const { userDetails } = company;
  const { id: uid } = userDetails;
  const { totalEnquiries, totalQuotes } = engagement;
  const { featureList } = features;

  let contentTabs = [];
  switch (tabs) {
    case 'admin':
      contentTabs = clinkTabs(contextType, totalEnquiries, totalQuotes);
      break;
    case 'adminProsper':
      contentTabs = prosperTabs(contextType, uid);
      break;
    case 'features':
      contentTabs = featuresTabs(contextType, featureList);
      break;
    default:
      break;
  }

  return (
    <div className="preq-tab-wrapper" data-testid="account-tabs-wrapper">
      <TabsComponent
        options={contentTabs}
        data-testid={`account-tabs-${tabs}`}
      />
    </div>
  );
};

const mapStateToProps = (state) => ({
  company: state.company,
  engagement: state.engagement,
  features: state.features,
});

export default connect(mapStateToProps)(DataContent);
