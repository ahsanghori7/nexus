import actions from './actions';
import { sendTrApprovalReminder } from 'store/reducers/clink/tender-recommendation';

// Mock all imported modules to check if they are correctly assigned
jest.mock('./admin/projects', () => ({
  fetchProjects: jest.fn(),
  fetchStatusList: jest.fn(),
  changeStatus: jest.fn(),
}));
jest.mock('./admin/users', () => ({
  fetchUsers: jest.fn(),
  createAccount: jest.fn(),
  updateUsers: jest.fn(),
}));
jest.mock('./admin/info', () => ({
  fetchAdminInfo: jest.fn(),
  fetchMainContractors: jest.fn(),
}));
jest.mock('./common/subcontractor', () => ({
  fetchSubcontractorInfo: jest.fn(),
  fetchRooms: jest.fn(),
  reduceInfoToken: jest.fn(),
  updateSubcontractorDescription: jest.fn(),
  unlockProject: jest.fn(),
  updateSubscription: jest.fn(),
  enableProsperProBanner: jest.fn(),
  updateSubscriptionHowToWin: jest.fn(),
  claimToken: jest.fn(),
  updateUserDetails: jest.fn(),
}));
jest.mock('./common/company', () => ({
  fetchCompany: jest.fn(),
  updateProfile: jest.fn(),
  updateOffering: jest.fn(),
  selectOption: jest.fn(),
  updateCompanyImage: jest.fn(),
  removeCompanyImage: jest.fn(),
  updateOfferingsRegions: jest.fn(),
  updateOfferingsTrades: jest.fn(),
  updateCompanyDetails: jest.fn(),
  getCompanyProfile: jest.fn(),
}));
jest.mock('./common/opportunities', () => ({
  fetchOpportunities: jest.fn(),
  saveLatestOnLocal: jest.fn(),
  fetchSingleProject: jest.fn(),
  updateRegisteredProject: jest.fn(),
  fetchOpportunitiesByAccount: jest.fn(),
}));
jest.mock('./prosper/enquiries', () => ({
  fetchEnquiries: jest.fn(),
  changeStatus: jest.fn(),
  patchStatus: jest.fn(),
  createQuote: jest.fn(),
  nextBatch: jest.fn(),
  tenderIsDownloaded: jest.fn(),
  fetchDocumentsHistory: jest.fn(),
}));
jest.mock('./common/filters', () => ({
  initFilter: jest.fn(),
  changeFilter: jest.fn(),
  changeDates: jest.fn(),
  increaseLoaded: jest.fn(),
  fetchFilterOptions: jest.fn(),
  resetFilter: jest.fn(),
}));
jest.mock('./prosper/registered_interests', () => ({
  fetchInterests: jest.fn(),
}));
jest.mock('./clink/analyse-quote', () => ({
  analyseFetch: jest.fn(),
  analyseStart: jest.fn(),
  setSeconds: jest.fn(),
  setAnalysisDataReset: jest.fn(),
  setCurrentTender: jest.fn(),
}));
jest.mock('./common/contacts', () => ({
  setOpenContactsModal: jest.fn(),
  fetchTenderTemplates: jest.fn(),
  setSelectedTemplate: jest.fn(),
  setTenderTemplates: jest.fn(),
  mockPostContactsFailure: jest.fn(),
  mockPostContactsSuccess: jest.fn(),
}));
jest.mock('./common/prequalification_v2', () => ({
  fetchPrequalification: jest.fn(),
  patchCompanyInformation: jest.fn(),
  fetchPrequalificationSections: jest.fn(),
  patchTurnover: jest.fn(),
  postPrequalFile: jest.fn(),
  resendReferences: jest.fn(),
  postReferences: jest.fn(),
  addCertificate: jest.fn(),
  postOrganization: jest.fn(),
  patchOrganization: jest.fn(),
  addTurnover: jest.fn(),
  updateTurnover: jest.fn(),
  removeTurnover: jest.fn(),
  updateSize: jest.fn(),
  deletePrequalificationSection: jest.fn(),
  deletePrequalificationReference: jest.fn(),
  patchOrganizationV2: jest.fn(),
  getPrequalification: jest.fn(),
  requestDocument: jest.fn(),
  deleteTeamMember: jest.fn(),
  changeLocalCompanyInfo: jest.fn(),
  getPrequalificationSections: jest.fn(),
  getPrequalificationStatuses: jest.fn(),
}));
jest.mock('./clink/project', () => ({
  fetchProject: jest.fn(),
  fetchProjectGantt: jest.fn(),
  updateTender: jest.fn(),
  fetchProjectSummary: jest.fn(),
  fetchPackageDependency: jest.fn(),
  resetProject: jest.fn(),
  addProject: jest.fn(),
  updateProject: jest.fn(),
  fetchTeamApi: jest.fn(),
  postMember: jest.fn(),
  deleteMember: jest.fn(),
  updateMember: jest.fn(),
}));
jest.mock('./prosper/Config', () => ({
  setTitle: jest.fn(),
  setType: jest.fn(),
  setLock: jest.fn(),
}));
jest.mock('./common/account', () => ({
  fetchTeam: jest.fn(),
  sendInvite: jest.fn(),
  removeMemberTeam: jest.fn(),
  changeRole: jest.fn(),
  fetchAccounts: jest.fn(),
  toggleStatus: jest.fn(),
  updateAccounts: jest.fn(),
  upgradeProsperPro: jest.fn(),
  fetchCompany: jest.fn(),
  distance: jest.fn(),
  toggleFirstPQQSend: jest.fn(),
}));
jest.mock('./clink/instructions', () => ({
  fetchInstructions: jest.fn(),
  fetchInstruction: jest.fn(),
  fetchStatus: jest.fn(),
  fetchType: jest.fn(),
  fetchSubcontractors: jest.fn(),
  deleteInstruction: jest.fn(),
  fetchForecastList: jest.fn(),
  createInstruction: jest.fn(),
  updateInstruction: jest.fn(),
  changeBudget: jest.fn(),
  blockAccess: jest.fn(),
  changeInstructionStatus: jest.fn(),
  resetInstruction: jest.fn(),
}));
jest.mock('./clink/instructions/documents', () => ({
  addDocument: jest.fn(),
  changeUploadingDocumentsState: jest.fn(),
  removeDocument: jest.fn(),
  initialDocumentUpdate: jest.fn(),
}));
jest.mock('./clink/orders', () => ({
  fetchOrders: jest.fn(),
  fetchQuoteFiles: jest.fn(),
  deleteOrder: jest.fn(),
  withdrawSentOrder: jest.fn(),
  markAsSignOrder: jest.fn(),
}));
jest.mock('./admin/analytics', () => ({
  fetchTokens: jest.fn(),
  fetchSupplyChainAnalytics: jest.fn(),
}));
jest.mock('./common/subscription', () => ({
  fetchSubscriptions: jest.fn(),
  changeSubscription: jest.fn(),
}));
jest.mock('./admin/activity', () => ({
  fetchActivities: jest.fn(),
}));
jest.mock('./admin/engagement', () => ({
  fetchEngagement: jest.fn(),
}));
jest.mock('./admin/supply_chain', () => ({
  fetchAdminSupplyChain: jest.fn(),
}));
jest.mock('./prosper/token', () => ({
  checkToken: jest.fn(),
  verifyToken: jest.fn(),
}));
jest.mock('./clink/constants', () => ({
  fetchConstants: jest.fn(),
  fetchRegions: jest.fn(),
}));
jest.mock('./prosper/opportunity-viewer', () => ({
  fetchTrades: jest.fn(),
  fetchRegions: jest.fn(),
  fetchOpportunity: jest.fn(),
}));
jest.mock('./prosper/teamManager', () => ({
  activateTeamAccount: jest.fn(),
}));
jest.mock('./admin/customer_health_score', () => ({
  fetchHealthScore: jest.fn(),
  updateHealthScore: jest.fn(),
}));
jest.mock('./common/layout', () => ({
  setBreadcrumbs: jest.fn(),
  setSlug: jest.fn(),
  setProjectName: jest.fn(),
  setLoaded: jest.fn(),
}));
jest.mock('./common/boq', () => ({
  fetchBoQList: jest.fn(),
  fetchBoQByTenderId: jest.fn(),
  fetchBoQQuotes: jest.fn(),
  fetchUnits: jest.fn(),
  fetchProjectStatuses: jest.fn(),
  createEntity: jest.fn(),
  updateEntity: jest.fn(),
  publishBoQ: jest.fn(),
  setEntitySaved: jest.fn(),
  setEditingMode: jest.fn(),
  republishBoQ: jest.fn(),
  quoteItems: jest.fn(),
  quoteItemsDocs: jest.fn(),
  publishQuote: jest.fn(),
  republishQuote: jest.fn(),
  setPackageNote: jest.fn(),
  fetchOrderTemplates: jest.fn(),
  setSubmitQuoteVars: jest.fn(),
  setSelectedEntries: jest.fn(),
  setEditingQuoteMode: jest.fn(),
  setLocalLoadQuotes: jest.fn(),
  changeCompliance: jest.fn(),
  fetchQuoteHistory: jest.fn(),
}));
jest.mock('./common/features', () => ({
  fetchFeatures: jest.fn(),
  fetchAccountFeatures: jest.fn(),
  updateAccountFeatures: jest.fn(),
  fetchAccountEnvelopes: jest.fn(),
  updateAccountEnvelopes: jest.fn(),
}));

jest.mock('./clink/tender-recommendation', () => ({
  getTenderRecommendations: jest.fn(),
  createTenderRecommendationForm: jest.fn(),
  getTenderRecommendationById: jest.fn(),
  updateTenderRecommendationById: jest.fn(),
  saveAsDraftTenderRecommendationById: jest.fn(),
  getTenderRecommendationPricingSummary: jest.fn(),
  updateTenderRecommendationPricingSummary: jest.fn(),
  getTenderRecommendationApprovers: jest.fn(),
  assignTenderRecommendationApprover: jest.fn(),
  withDrawTenderRecommendation: jest.fn(),
  sendTrApprovalReminder: jest.fn(),
}));

jest.mock('./clink/tender-inquiry', () => ({
  assignTenderInquiryApprover: jest.fn(),
  approveRejectInquiry: jest.fn(),
  acknowledgeRejectionFeedback: jest.fn(),
  assignedApproversTenderInquiry: jest.fn(),
}));
jest.mock('./clink/procurement-schedule', () => ({
  fetchApproversShortlistedSubs: jest.fn(),
}));
describe('actions', () => {
  it('should export actions categorized by application', () => {
    expect(actions).toBeDefined();
    expect(actions.admin).toBeDefined();
    expect(actions.prosper).toBeDefined();
    expect(actions.clink).toBeDefined();

    // Verify some actions in each category
    expect(actions.admin.fetchProjects).toBeDefined();
    expect(actions.prosper.fetchOpportunities).toBeDefined();
    expect(actions.clink.fetchProject).toBeDefined();

    expect(actions.clink.getTenderRecommendations).toBeDefined();
    expect(actions.clink.createTenderRecommendationForm).toBeDefined();
    expect(actions.clink.getTenderRecommendationById).toBeDefined();
    expect(actions.clink.updateTenderRecommendationById).toBeDefined();
    expect(actions.clink.saveAsDraftTenderRecommendationById).toBeDefined();
    expect(actions.clink.getTenderRecommendationPricingSummary).toBeDefined();
    expect(
      actions.clink.updateTenderRecommendationPricingSummary,
    ).toBeDefined();
    expect(actions.clink.getTenderRecommendationApprovers).toBeDefined();
    expect(actions.clink.assignTenderRecommendationApprover).toBeDefined();
    expect(actions.clink.withDrawTenderRecommendation).toBeDefined();
    expect(actions.clink.sendTrApprovalReminder).toBeDefined();

    // Verify tender inquiry actions
    expect(actions.clink.assignTenderInquiryApprover).toBeDefined();
    expect(actions.clink.approveRejectInquiry).toBeDefined();
    expect(actions.clink.acknowledgeRejectionFeedback).toBeDefined();
    expect(actions.clink.assignedApproversTenderInquiry).toBeDefined();
    expect(actions.clink.fetchApproversShortlistedSubs).toBeDefined();

    // Verify that the assigned actions are the mocked functions
    // This is a basic check, more specific checks can be added if needed
  });
});
