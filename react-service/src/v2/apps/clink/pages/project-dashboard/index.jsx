import React, { useEffect, useState, useMemo } from 'react';
import { ViewMode } from 'clink-components';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import { StyledProjectsContainer } from './styled';
import GanttTaskReact from './gantt-task-react';

const ProjectDashboard = ({ project, constants, isThereTasks, loading }) => {
  const [alert, setAlert] = useState(false);
  const [firstTime, setFirstTime] = useState(true);
  const [view, setView] = useState(ViewMode.Month);

  const params = useParams();
  const { slug } = params;
  const { tasks, showAlert } = project;

  useEffect(() => {
    if (showAlert && firstTime) {
      setAlert(showAlert);
      setFirstTime(false);
    }
  }, [firstTime, showAlert]);

  const tender = useMemo(() => {
    if (constants?.tender) {
      return constants?.tender;
    }
    return {};
  }, [constants]);

  const service = useMemo(() => {
    if (tender?.service) {
      return tender?.service;
    }
    return {};
  }, [tender]);

  const size = useMemo(() => {
    if (tender?.size) {
      return tender?.size;
    }
    return {};
  }, [tender]);

  // cast to dates inside component to avoid issues with date parsing in Redux
  const formattedTasks = useMemo(() => {
    if (isThereTasks) {
      return tasks.map((task) => ({
        ...task,
        start: new Date(task.start),
        tenderReturn: new Date(task.tenderReturn),
        startOnSite: new Date(task.startOnSite),
        enquirySentDate: new Date(task.enquirySentDate),
        end: new Date(task.end),
        decisionDate: task?.decisionDate ? new Date(task.decisionDate) : null,
        subcontractWorkFinish: task?.subcontractWorkFinish
          ? new Date(task.subcontractWorkFinish)
          : null,
        beforeEnd: task?.beforeEnd ? new Date(task.beforeEnd) : null,
      }));
    }
    return [];
  }, [tasks, isThereTasks]);

  return (
    <>
      {loading && (
        <Box sx={{ width: '100%' }}>
          <Skeleton variant="rectangular" width="100%" height={118} />
          <LinearProgress />
        </Box>
      )}
      <StyledProjectsContainer className="dashboard-projects-container-wrapper">
        {!loading && isThereTasks && (
          <GanttTaskReact
            alert={alert}
            tasks={formattedTasks}
            service={service}
            size={size}
            useSetView={[view, setView]}
            slug={slug}
          />
        )}
      </StyledProjectsContainer>
    </>
  );
};

const mapStateToProps = (state) => {
  return {
    project: state.project,
    quotesData: state?.quotesTender?.quotesData || {},
    procurementSchedule: state?.procurementSchedule?.packages || [],
    orders: state?.order?.list || [],
    constants: state.constants,
  };
};

export default connect(mapStateToProps)(ProjectDashboard);
