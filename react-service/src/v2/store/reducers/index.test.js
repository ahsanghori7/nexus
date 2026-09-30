import appReducer from './index';
import { combineReducers } from 'redux';

// Import all mocked reducers
import projectsReducer from './admin/projects';
import usersReducer from './admin/users';
import adminReducer from './admin/info';
import subcontractorReducer from './common/subcontractor';
import templatesReducer from './clink/templates';
import quotesTenderReducer from './clink/quotes-tender';
import opportunitiesReducer from './common/opportunities';
import enquiriesReducer from './prosper/enquiries';
import filtersReducer from './common/filters';
import interestsReducer from './prosper/registered_interests';
import prequalificationV2Reducer from './common/prequalification_v2';
import companyReducer from './common/company';
import projectReducer from './clink/project';
import constantsReducer from './clink/constants';
import accountReducer from './common/account';
import instructionsReducer from './clink/instructions';
import instructionsDocumentsReducer from './clink/instructions/documents';
import analyticsReducer from './admin/analytics';
import subscriptionReducer from './common/subscription';
import activityReducer from './admin/activity';
import engagementReducer from './admin/engagement';
import tokenReducer from './prosper/token';
import opportunityViewerReducer from './prosper/opportunity-viewer';
import teamManagerSubscription from './prosper/teamManager';
import supplyChainReducer from './admin/supply_chain';
import clinkAccountReducer from './clink/account';
import customerHealthScoreReducer from './admin/customer_health_score';
import configReducer from './prosper/Config';
import orderReducer from './clink/orders';
import boqReducer from './common/boq';
import attributesReducer from './common/attributes';
import featuresReducer from './common/features';
import layoutReducer from './common/layout';
import analyseQuotesReducer from './clink/analyse-quote';
import contactsReducer from './common/contacts';
import procurementScheduleReducer from './clink/procurement-schedule';
import clinkSupplyChainReducer from './clink/supply-chain';
import tenderTemplatesReducer from './clink/tender-templates';
import tenderRecommendationReducer from './clink/tender-recommendation';
import downloadManagerReducer from './clink/download-manager';
import logsReducer from './admin/logs';
import tenderInsightsReducer from './prosper/tender-insights';
import notificationsReducer from './common/notifications';

// Mock combineReducers
jest.mock('redux', () => ({
  ...jest.requireActual('redux'),
  combineReducers: jest.fn((reducers) => reducers), // Mock combineReducers to return the reducers object
}));

// Mock all imported reducers
jest.mock('./admin/projects', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('./admin/users', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('./admin/info', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('./common/subcontractor', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./common/opportunities', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./prosper/enquiries', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./common/filters', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('./prosper/registered_interests', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./common/prequalification_v2', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./common/company', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('./clink/project', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('./clink/constants', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./common/account', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('./clink/instructions', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./clink/instructions/documents', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./admin/analytics', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./common/subscription', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./admin/activity', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('./admin/engagement', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./prosper/token', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('./prosper/opportunity-viewer', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./prosper/teamManager', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./admin/supply_chain', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./clink/account', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('./admin/customer_health_score', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./prosper/Config', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('./clink/orders', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('./common/boq', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('./common/features', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./common/layout', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('./clink/analyse-quote', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./common/contacts', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./prosper/tender-insights', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./clink/download-manager', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('./common/notifications', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('appReducer', () => {
  beforeEach(() => {
    combineReducers.mockClear();
  });

  it('should combine admin reducers for "admin" app', () => {
    appReducer('admin');
    expect(combineReducers.mock.calls[0][0]).toEqual({
      projects: projectsReducer,
      account: accountReducer,
      users: usersReducer,
      admin: adminReducer,
      filters: filtersReducer,
      company: companyReducer,
      analytics: analyticsReducer,
      subscription: subscriptionReducer,
      opportunities: opportunitiesReducer,
      prequalificationV2: prequalificationV2Reducer,
      activity: activityReducer,
      engagement: engagementReducer,
      supply_chain: supplyChainReducer,
      customerHealthScore: customerHealthScoreReducer,
      features: featuresReducer,
      attributes: attributesReducer,
      logs: logsReducer,
      notifications: notificationsReducer,
    });
  });

  it('should combine prosper reducers for "prosper" app', () => {
    appReducer('prosper');
    expect(combineReducers.mock.calls[0][0]).toEqual({
      subcontractor: subcontractorReducer,
      opportunities: opportunitiesReducer,
      enquiries: enquiriesReducer,
      filters: filtersReducer,
      interests: interestsReducer,
      prequalificationV2: prequalificationV2Reducer,
      company: companyReducer,
      token: tokenReducer,
      opportunityViewer: opportunityViewerReducer,
      teamManager: teamManagerSubscription,
      account: accountReducer,
      subscription: subscriptionReducer,
      config: configReducer,
      project: projectReducer,
      boq: boqReducer,
      attributes: attributesReducer,
      tenderInsights: tenderInsightsReducer,
      notifications: notificationsReducer,
    });
  });

  it('should combine clink reducers for "clink" app', () => {
    appReducer('clink');
    expect(combineReducers.mock.calls[0][0]).toEqual({
      templates: templatesReducer,
      subcontractor: subcontractorReducer,
      quotesTender: quotesTenderReducer,
      project: projectReducer,
      account: accountReducer,
      instructions: instructionsReducer,
      instructionsDocuments: instructionsDocumentsReducer,
      constants: constantsReducer,
      prequalificationV2: prequalificationV2Reducer,
      procurementSchedule: procurementScheduleReducer,
      company: companyReducer,
      clinkAccount: clinkAccountReducer,
      order: orderReducer,
      boq: boqReducer,
      layout: layoutReducer,
      analysis: analyseQuotesReducer,
      contacts: contactsReducer,
      attributes: attributesReducer,
      supplyChain: clinkSupplyChainReducer,
      tenderTemplates: tenderTemplatesReducer,
      tenderRecommendation: tenderRecommendationReducer,
      downloadManager: downloadManagerReducer,
      notifications: notificationsReducer,
    });
  });

  it('should return an empty object for unknown app', () => {
    appReducer('unknown');
    expect(combineReducers.mock.calls[0][0]).toEqual({});
  });
});
