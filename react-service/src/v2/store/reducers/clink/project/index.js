import { createSlice } from '@reduxjs/toolkit';
import isEmpty from 'lodash/isEmpty';
import uniqBy from 'lodash/uniqBy';
import Subscription from 'v2/helpers/user/subscription';
import extraReducers, {
  fetchProject,
  fetchProjectGantt,
  updateTender,
  fetchProjectSummary,
  fetchPackageDependency,
  addProject,
  updateProject,
  fetchTeamApi,
  postMember,
  deleteMember,
  getProjectTenders,
  getProjectMilestones,
  updatePackages,
  fetchProjectEnquiries,
  getDashboardActions,
  removeOrRestoreDashboardAction,
  fetchShortlistedSubcontractors,
} from './extraReducers';
import { initTasks, getStatusOverview, getBudgetSummary } from './helper';

const subscriptionHelper = new Subscription();
const ENQUIRY_WAS_NOT_SENT = [10, 6];

const initialIfsProjectsState = {
  records: [],
  total: 0,
  page: 1,
  search: '',
  loading: false,
  loadingMore: false,
  error: null,
};

const initialLinkedIfsProjectState = {
  data: null,
  loading: false,
  error: null,
};

const initialState = {
  data: null,
  status: '',
  instructions: [],
  summary: {},
  dependency: {},
  dependencyStatus: true,
  statusSummary: '',
  loadingSummary: false,
  loadingStatus: false,
  members: [],
  tasks: [],
  overview: [],
  summaryOverview: {},
  showAlert: false,
  tenders: {},
  openedDatePickerId: null,
  dashboardActions: {},
  shortlistedSubcontractors: {},
  loadingShortlistedSubcontractors: false,
  milestones: [],
  ifsProjects: { ...initialIfsProjectsState },
  linkedIfsProject: { ...initialLinkedIfsProjectState },
};

const parseV2Date = (dateStr) => {
  if (!dateStr || dateStr === '-' || dateStr === '—') return null;

  // Handle DD-MM-YYYY format from v2 API
  if (typeof dateStr === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('-');
    return `${year}-${month}-${day}`; // Convert to YYYY-MM-DD for consistency
  }

  return dateStr;
};

const transformV2Milestone = (milestone) => {
  if (!milestone) return null;

  return {
    id: milestone.id,
    status: milestone.sort_order,
    date: milestone.planned_end_date,
    name: milestone.label,
    risk: milestone.lead_time_status, // "Overdue", "Approaching", "On Track"
    milestone_type: milestone.type,
  };
};

const getCompanyStatusLabel = (status) => {
  if (!status) return null;
  if (typeof status === 'string') return status;
  if (typeof status === 'object') {
    return (
      status.clink_label ||
      status.label ||
      status.uid ||
      status.prosper_label ||
      null
    );
  }
  return null;
};

const isSubcontractorAwarded = (subcontractor) => {
  if (!subcontractor) return false;
  const isAwarded =
  subcontractor.awarded === true || subcontractor.awarded === 1;
  if (isAwarded)
    return true;

  const statusUid =
    subcontractor.status && typeof subcontractor.status === 'object'
      ? subcontractor.status.uid
      : subcontractor.status;

  return (
    typeof statusUid === 'string' && statusUid.toLowerCase().includes('awarded')
  );
};

const transformV2Procurement = (procurement) => {
  if (!procurement || typeof procurement !== 'object') {
    return [];
  }

  return Object.values(procurement).map((subcontractor) => {
    const hasProperAccount =
      subcontractor?.sub_id &&
      !subscriptionHelper.isExternalMin(subcontractor?.subscription_id);

    return {
      id: subcontractor.id || subcontractor.sub_id,
      name: subcontractor.name,
      awarded: isSubcontractorAwarded(subcontractor),
      url: hasProperAccount
        ? `/main-contractor/supply_chain/${subcontractor.sub_id || subcontractor.id}?return=sc`
        : false,
      has_document: !ENQUIRY_WAS_NOT_SENT.includes(
        Number(subcontractor?.status?.id),
      ),
      status: getCompanyStatusLabel(subcontractor.status),
    };
  });
};

const transformV2TenderCoverage = (tenderCoverage) => {
  if (!tenderCoverage || typeof tenderCoverage !== 'string') {
    return { percentage: null, display: '—' };
  }

  const parts = tenderCoverage.split('/');
  if (parts.length !== 2) {
    return { percentage: null, display: '—' };
  }

  const [numerator, denominator] = parts.map((p) => parseInt(p, 10));

  if (!denominator) {
    return { percentage: null, display: '—' };
  }

  const percentage =
    denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;

  return {
    percentage,
    display: `${tenderCoverage} (${percentage}%)`,
  };
};

const transformV2ToOverview = (item) => {
  // Build procurement list from backend procurement object
  const procurementList = transformV2Procurement(item.procurement);

  // Also include shortlisted subcontractors (if any) from the item
  const shortlistedRaw =
    item.shortlisted_subcontractors || item.shortlisted || [];
  const shortlistedList = Array.isArray(shortlistedRaw)
    ? shortlistedRaw.map((s) => {
        const id = s.subcontractor_id || s.id || s.sub_id;
        const hasProperAccount =
          (s?.sub_id || s?.subcontractor_id || s?.id) &&
          !subscriptionHelper.isExternalMin(s?.subscription_id);

        return {
          id,
          name: s.name || s.company_name || '',
          awarded: false,
          url: hasProperAccount
            ? `/main-contractor/supply_chain/${s.subcontractor_id || s.sub_id || s.id}?return=sc`
            : false,
          has_document: !!s.has_document || false,
          status: getCompanyStatusLabel(s.status),
        };
      })
    : [];

  // Merge procurement and shortlisted lists, preferring procurement entries (procurementList placed first)
  const subcontractors = uniqBy([...procurementList, ...shortlistedList], 'id');

  return {
    id: item.id,
    package: item.label,
    reference_no: item.reference_no || null,
    subcontractors,
    tenderCoverage: transformV2TenderCoverage(item.tender_coverage),
    current_milestone: transformV2Milestone(item.milestones?.current),
    next_milestone: transformV2Milestone(item.milestones?.next),
    complete_milestone: item.milestones?.completed,
    budget: item.budget || 0,
    actual: item.order_value || 0,
    variance: item.variance || 0,
    issue_order: parseV2Date(item?.order_issue_date) || '—',
    start_on_site: parseV2Date(item?.start_on_site),
    status: item.milestones?.current?.status || 'Not Started',
    // Keep v2 specific fields for enhanced functionality
    variance_type: item.variance_type,
    variance_percent: item.variance_percent,
  };
};

const hasMilestonesData = (procurementSchedule) => {
  if (!procurementSchedule?.length) return false;
  // V2 data has milestones object
  return procurementSchedule[0]?.milestones !== undefined;
};

const hasValidDate = (item) =>
  !isEmpty(item?.start_on_site) || !isEmpty(item?.tender_return);

const isDisplayablePackage = (item) =>
  hasValidDate(item) &&
  !isEmpty(item?.service_label) &&
  !isEmpty(item?.packages);

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setOpenedDatePickerId(state, { payload }) {
      state.openedDatePickerId = payload;
    },
    resetProject(state) {
      state.data = null;
      state.status = '';
      state.instructions = [];
      state.summary = {};
      state.dependency = {};
      state.dependencyStatus = true;
      state.statusSummary = '';
      state.loadingSummary = false;
      state.loadingStatus = false;
      state.members = [];
      state.tasks = [];
      state.overview = [];
      state.summaryOverview = {};
      state.showAlert = false;
      state.tenders = {};
      state.openedDatePickerId = null;
      state.shortlistedSubcontractors = {};
      state.loadingShortlistedSubcontractors = false;
      state.ifsProjects = { ...initialIfsProjectsState };
      state.linkedIfsProject = { ...initialLinkedIfsProjectState };
    },
    resetIfsProjects(state) {
      state.ifsProjects = { ...initialIfsProjectsState };
    },
    resetLinkedIfsProject(state) {
      state.linkedIfsProject = { ...initialLinkedIfsProjectState };
    },
    resetOverview(state) {
      state.overview = [];
      state.tasks = [];
      state.summaryOverview = {};
      state.summary = {};
      state.openedDatePickerId = null;
    },
    updateMember(state, { payload }) {
      state.members = state.members.map((m) => {
        if (String(payload.id) === String(m.user_id)) {
          return {
            ...m,
            member: {
              ...m.member,
              [payload.name]: payload.value,
            },
          };
        }
        return m;
      });
    },
    setTasks(state) {
      if (state?.data?.tender?.length) {
        const [formattedTenders, showAlert] = initTasks(
          state?.data?.tender,
          state.summary,
          state.dependency,
        );
        state.tasks = formattedTenders;
        state.showAlert = showAlert;
      }
    },
    setOverview(state, { payload }) {
      let overview = [
        {
          id: false,
          package: false,
          reference_no: false,
          subcontractors: false,
          tenderCoverage: false,
          current_milestone: false,
          next_milestone: false,
          budget: false,
          actual: false,
          variance: false,
          issue_order: false,
          start_on_site: false,
          status: false,
        },
      ];

      const {
        loadingQuotes,
        orders,
        loadingOrders,
        procurementSchedule,
        submittingProcurement,
        loadingSummary,
      } = payload;

      // Check if this is v2 data (has milestones from backend)
      const hasMilestones = hasMilestonesData(procurementSchedule);

      if (hasMilestones) {
        if (procurementSchedule?.length && !submittingProcurement) {
          overview = procurementSchedule
            .filter(isDisplayablePackage)
            .map((item) => transformV2ToOverview(item));
        }

        state.overview = overview;

        // Calculate summary for v2
        if (
          !submittingProcurement &&
          overview.length &&
          overview[0].id !== false
        ) {
          const budgetTotal = overview.reduce(
            (acc, item) => acc + (Number(item?.budget) || 0),
            0,
          );
          const actualTotal = overview.reduce(
            (acc, item) => acc + (Number(item?.actual) || 0),
            0,
          );

          state.summaryOverview = {
            budget: budgetTotal,
            forecast: actualTotal,
            profit_loss: budgetTotal - actualTotal,
          };
        }
      } else {
        // VERSION 1: Original logic - calculate milestones on frontend
        if (state?.data?.tender?.length) {
          overview = state.data.tender
            .filter((t) => t.state)
            .filter(hasValidDate)
            .filter((item) => {
              const psByTid = procurementSchedule.find(
                (ps) => Number(ps.id) === Number(item.id),
              );
              return !isEmpty(psByTid?.service_label) && !isEmpty(psByTid?.packages);
            })
            .map((tender) => {
              const id = tender?.id;
              const awarded = tender?.awarded;
              const quoteData = payload?.quotesData?.tenders?.[id] || {};
              const quotes = quoteData.quotes || {};
              const subcontractorsQT = uniqBy(
                Object.values(quotes || {}),
                'subcontractor_id',
              ).map((quote) => {
                let awardedTo = quote.order_price > 0;
                if (quoteData?.awarded_to) {
                  awardedTo =
                    Number(quoteData?.awarded_to?.id) ===
                      Number(quote.subcontractor_id) || awardedTo;
                }
                return {
                  id: quote.subcontractor_id,
                  name: quote.subcontractor.name,
                  awarded: awardedTo,
                  url: `/main-contractor/supply_chain/${quote.subcontractor.id}?return=sc`,
                };
              });

              const psByTid = procurementSchedule.find(
                (ps) => Number(ps.id) === Number(id),
              );
              const subcontractors = Object.values(
                psByTid?.procurement || {},
              ).map((ps) => {
                const hasProperAccount =
                  ps?.sub_id &&
                  !subscriptionHelper.isExternalMin(ps?.subscription_id);

                const findQuote = subcontractorsQT.find(
                  (qt) => Number(qt.id) === Number(ps.sub_id),
                );

                return {
                  id: ps.sub_id,
                  name: ps.name,
                  awarded: findQuote?.awarded || false,
                  url: hasProperAccount
                    ? `/main-contractor/supply_chain/${ps.sub_id}?return=sc`
                    : false,
                  has_document: !ENQUIRY_WAS_NOT_SENT.includes(
                    Number(ps?.status?.id),
                  ),
                };
              });

              const invited = subcontractors.length;
              const invitedWithTender = subcontractors.filter(
                (sub) => sub?.has_document,
              ).length;

              const percentage = invited
                ? Math.round((invitedWithTender / invited) * 100)
                : 0;
              const coverageData = {
                percentage,
                display: `${invitedWithTender}/${invited} (${percentage}%)`,
              };

              const loadingSubInfo = submittingProcurement || loadingQuotes;
              const loadingOrderInfo = loadingQuotes || loadingOrders;
              const loadingSubInfoOrder =
                loadingSubInfo || loadingOrderInfo || loadingSummary;

              const packStatus = !loadingSubInfoOrder
                ? getStatusOverview(
                    state.summary,
                    tender,
                    subcontractorsQT,
                    orders,
                    procurementSchedule,
                    awarded,
                  )
                : false;

              const budget = quoteData?.budget || 0;
              const actual = packStatus?.value
                ? Number(packStatus?.value) * 100
                : 0;
              const variance = budget - actual;

              return {
                id,
                package: tender?.label || null,
                reference_no: tender?.reference_no || null,
                subcontractors: (!loadingSubInfo && subcontractors) || false,
                tenderCoverage: !submittingProcurement ? coverageData : false,
                current_milestone: packStatus && packStatus.current,
                next_milestone: packStatus && packStatus.next,
                budget: !loadingQuotes ? budget : false,
                actual: !loadingQuotes ? actual : false,
                variance: !loadingOrderInfo ? variance : false,
                issue_order: packStatus && packStatus.issue_order,
                start_on_site: packStatus && packStatus.start_on_site,
                status: packStatus && packStatus.status,
              };
            });
        }

        state.overview = overview;

        if (!loadingQuotes && !isEmpty(payload?.quotesData)) {
          const budgetSummary = getBudgetSummary(payload?.quotesData);
          if (overview.length) {
            let actualTotal = overview.reduce(
              (acc, item) => acc + (Number(item?.actual) || 0),
              0,
            );
            actualTotal = actualTotal ? Number(actualTotal) : 0;
            budgetSummary.forecast = actualTotal;
            budgetSummary.profit_loss = budgetSummary.budget - actualTotal;
          }
          state.summaryOverview = budgetSummary;
        }
      }
    },
  },
  extraReducers,
});

export const {
  resetProject,
  resetIfsProjects,
  resetLinkedIfsProject,
  updateMember,
  setTasks,
  setOverview,
  resetOverview,
  setOpenedDatePickerId,
} = projectSlice.actions;
export {
  fetchProject,
  fetchProjectGantt,
  updateTender,
  fetchProjectSummary,
  fetchPackageDependency,
  addProject,
  updateProject,
  fetchTeamApi,
  postMember,
  deleteMember,
  getProjectTenders,
  getProjectMilestones,
  updatePackages,
  fetchProjectEnquiries,
  getDashboardActions,
  removeOrRestoreDashboardAction,
  fetchShortlistedSubcontractors,
};
export { fetchIfsProjects, fetchLinkedIfsProject } from './extraReducers';
export default projectSlice.reducer;
