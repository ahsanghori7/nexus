import { combineReducers } from 'redux';
import projectsReducer from './admin/projects';
import usersReducer from './admin/users';
import adminReducer from './admin/info';
import subcontractorReducer from './common/subcontractor';
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
import featuresReducer from './common/features';
import layoutReducer from './common/layout';
import analyseQuotesReducer from './clink/analyse-quote';
import contactsReducer from './common/contacts';
import templatesReducer from './clink/templates';
import quotesTenderReducer from './clink/quotes-tender';
import clinkSupplyChainReducer from './clink/supply-chain';
import attributesReducer from './common/attributes';
import procurementScheduleReducer from './clink/procurement-schedule';
import tenderTemplatesReducer from './clink/tender-templates';
import tenderRecommendationReducer from './clink/tender-recommendation';
import downloadManagerReducer from './clink/download-manager';
import logsReducer from './admin/logs';
import tenderInsightsReducer from './prosper/tender-insights';
import notificationsReducer from './common/notifications';

const reducers = {
  admin: {
    projects: projectsReducer,
    account: accountReducer,
    users: usersReducer,
    admin: adminReducer,
    filters: filtersReducer,
    prequalificationV2: prequalificationV2Reducer,
    company: companyReducer,
    analytics: analyticsReducer,
    subscription: subscriptionReducer,
    opportunities: opportunitiesReducer,
    activity: activityReducer,
    engagement: engagementReducer,
    supply_chain: supplyChainReducer,
    customerHealthScore: customerHealthScoreReducer,
    features: featuresReducer,
    attributes: attributesReducer,
    logs: logsReducer,
    notifications: notificationsReducer,
  },
  prosper: {
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
  },
  clink: {
    subcontractor: subcontractorReducer,
    project: projectReducer,
    account: accountReducer,
    instructions: instructionsReducer,
    instructionsDocuments: instructionsDocumentsReducer,
    constants: constantsReducer,
    prequalificationV2: prequalificationV2Reducer,
    company: companyReducer,
    clinkAccount: clinkAccountReducer,
    order: orderReducer,
    boq: boqReducer,
    layout: layoutReducer,
    analysis: analyseQuotesReducer,
    contacts: contactsReducer,
    templates: templatesReducer,
    quotesTender: quotesTenderReducer,
    supplyChain: clinkSupplyChainReducer,
    attributes: attributesReducer,
    procurementSchedule: procurementScheduleReducer,
    tenderTemplates: tenderTemplatesReducer,
    tenderRecommendation: tenderRecommendationReducer,
    downloadManager: downloadManagerReducer,
    notifications: notificationsReducer,
  },
};

// "Root reducer"
const appReducer = (app = 'admin') => combineReducers(reducers[app] || {});

export default appReducer;
