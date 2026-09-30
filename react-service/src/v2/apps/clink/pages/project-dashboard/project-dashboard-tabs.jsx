import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import isEmpty from 'lodash/isEmpty';
import { connect } from 'react-redux';
import { useContext } from 'v2/hooks/context';
import { Tabs, Tab, Box } from '@mui/material';
import ProjectDashboard from './index';
import ProcurementScheduleOverview from './procurement-schedule-overview';
import flag from 'v2/helpers/flags';
import ProjectLoading from './ProjectLoading';

const initialTab = flag('PROCUREMENT_SCHEDULE_OVERVIEW') ? 0 : 1;
const ProjectDashboardTabs = ({
  dispatch,
  project,
  quotesData,
  procurementSchedule,
  orders,
  constants,
  loadingSummary,
  loadingStatus,
  loadingQuotes,
  loadingOrders,
  submittingProcurement,
  overview,
  summaryOverview,
}) => {
  const [value, setValue] = useState(initialTab);
  const context = useContext('clink');
  const { actions } = context;

  const params = useParams();
  const { slug } = params;
  const { data, summary, tasks, dependencyStatus } = project;
  const tenders = data?.tender || null;

  const handleChange = (_, newValue) => {
    setValue(newValue);
  };

  useEffect(() => {
    if (slug && isEmpty(constants?.tender)) {
      dispatch(actions.fetchConstants());
    }
  }, [actions, dispatch, slug, constants]);

  useEffect(() => {
    if (data?.id && isEmpty(summary) && dependencyStatus) {
      dispatch(actions.fetchProjectSummary(data.id));
      dispatch(actions.fetchPackageDependency(data.id));
    }
  }, [data?.id, dispatch, actions, summary, dependencyStatus]);

  useEffect(() => {
    if (project?.data?.id && project?.data?.name !== quotesData?.name) {
      dispatch(actions.fetchQuotes(project?.data?.id));
      dispatch(actions.fetchQuoteFiles(project?.data?.id));
      dispatch(actions.fetchQuoteDocuments(project?.data?.id));
    }
  }, [
    project?.data?.id,
    dispatch,
    actions,
    quotesData?.name,
    project?.data?.name,
  ]);

  useEffect(() => {
    if (project?.data?.id && !orders?.length) {
      dispatch(actions.fetchOrders(project?.data?.id));
    }
  }, [actions, dispatch, orders?.length, project?.data?.id]);

  useEffect(() => {
    if (project?.data?.id && !procurementSchedule?.length) {
      const projectVersion = data?.version;
      if (projectVersion === 1) {
        dispatch(
          actions.getProjectProcurement({
            pid: project?.data?.id
          }),
        );
      } else if (projectVersion === 2) {
        dispatch(
          actions.getProjectProcurementOverviewV2({
            project_id: project?.data?.id,
          }),
        );
      }
    }
  }, [
    actions,
    dispatch,
    procurementSchedule?.length,
    project?.data?.id,
    data?.version,
  ]);

  useEffect(() => {
    if (tenders?.length && !isEmpty(summary) && !tasks?.length) {
      dispatch(actions.setTasks());
    }
  }, [actions, dispatch, summary, tasks?.length, tenders?.length]);

  useEffect(() => {
    dispatch(
      actions.setOverview({
        quotesData,
        loadingQuotes,
        orders,
        loadingOrders,
        procurementSchedule,
        submittingProcurement,
        loadingSummary,
      }),
    );
  }, [
    project?.data?.id,
    project?.data?.tender,
    dispatch,
    actions,
    quotesData?.name,
    quotesData,
    summary,
    orders,
    procurementSchedule,
    loadingQuotes,
    loadingOrders,
    submittingProcurement,
    loadingSummary,
  ]);

  const loadings = useMemo(() => {
    let list = {
      'Loading Project': loadingStatus,
      'Loading Summary': loadingSummary,
    };
    if (flag('PROCUREMENT_SCHEDULE_OVERVIEW')) {
      list = {
        ...list,
        'Loading Quotes': loadingQuotes,
        'Loading Orders': loadingOrders,
        'Loading Procurement Schedule': submittingProcurement,
      };
    }
    return list;
  }, [
    loadingStatus,
    loadingSummary,
    loadingQuotes,
    loadingOrders,
    submittingProcurement,
  ]);

  const loading = useMemo(() => {
    return Object.values(loadings).some((i) => i);
  }, [loadings]);

  const isThereTasks = useMemo(() => {
    return Boolean(tasks?.length);
  }, [tasks]);

  const hasOverviewData = useMemo(() => {
    return Boolean(overview?.length);
  }, [overview]);

  return (
    <Box>
      {flag('PROCUREMENT_SCHEDULE_OVERVIEW') && (
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="Project tabs"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Procurement Schedule Overview" />
          <Tab label="Project Timeline" />
        </Tabs>
      )}
      <Box mt={2}>
        {value === 1 && (
          <>
            <ProjectLoading
              loading={loading}
              isThereTasks={isThereTasks}
              slug={slug}
            />
            <ProjectDashboard isThereTasks={isThereTasks} loading={loading} />
          </>
        )}
        {value === 0 && flag('PROCUREMENT_SCHEDULE_OVERVIEW') && (
          <>
            <ProjectLoading
              loading={loading}
              isThereTasks={hasOverviewData}
              slug={slug}
            />
            <ProcurementScheduleOverview
              overview={overview}
              summary={summaryOverview}
            />
          </>
        )}
      </Box>
    </Box>
  );
};

const mapStateToProps = (state) => {
  return {
    project: state.project,
    quotesData: state?.quotesTender?.quotesData || {},
    procurementSchedule: state?.procurementSchedule?.packages || [],
    orders: state?.order?.list || [],
    constants: state.constants,
    loadingSummary: state.project.loadingSummary,
    loadingStatus: state.project.loadingStatus,
    loadingQuotes: state.quotesTender.loadingQuotes,
    loadingOrders: state.order.loadingOrders,
    submittingProcurement: state.procurementSchedule.submittingProcurement,
    overview: state?.project?.overview || [],
    summaryOverview: state?.project?.summaryOverview || [],
  };
};
export default connect(mapStateToProps)(ProjectDashboardTabs);
