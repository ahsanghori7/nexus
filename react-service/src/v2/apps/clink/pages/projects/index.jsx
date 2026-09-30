import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Grid2 from '@mui/material/Grid2';
import Skeleton from '@mui/material/Skeleton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { CONSTANTS } from 'clink-components';
import { patchData } from 'services/clinkHelpers';
import Relay from 'v1/global/services/Relay';
import ConfirmModal from 'v2/apps/shared/components/confirm-modal/v3';
import Modal from 'v2/apps/clink/pages/orders/subcontractors/modal';
import AddProjectV2 from 'v2/apps/clink/pages/pmp/add-project';
import { goTo } from 'v2/helpers/url';
import PackagesModal from 'v1/global/components/packages-modal';
import ProjectListItem from './ProjectListItem';
import DashboardTabs from './DashboardTabs';
import flag from 'helpers/flags';

const { clinkLightPurple, mediumGray, white } = CONSTANTS.colors.general;

const PUBLISHED = 1;
const ARCHIVED = 2;
const contextType = 'clink';

const Projects = ({ dispatch, constants, dashboardActions, clinkAccount }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState('');
  const [openConfirm, setOpenConfirm] = useState(false);
  const [projectsList, setProjectsList] = useState([]);
  const [sortOption, setSortOption] = useState('name');
  const context = useContext(contextType);
  const { actions } = context;

  const canCreateProject = clinkAccount?.acl?.createProject?.canView || false;

  const currentDate = new Date();
  const projectType = constants?.project?.type || [];

  const fetchDashboardActions = useCallback(
    (filter = 'all') => {
      dispatch(actions.getDashboardActions({ filter }));
    },
    [actions, dispatch],
  );

  const dispatchRemoveOrRestoreDashboardAction = useCallback(
    (approver_id, is_read) => {
      return dispatch(
        actions.removeOrRestoreDashboardAction({ approver_id, is_read }),
      );
    },
    [actions, dispatch],
  );

  useEffect(() => {
    const projectList = new Relay('project', 'getAll');
    projectList.getJson().then((data) => {
      setProjectsList(data || []);
      setLoading(false);
    });
    dispatch(actions.resetProject());
    dispatch(actions.resetQuotesTender());
    dispatch(actions.restartOrders());
    dispatch(actions.restartProcurement());
    dispatch(actions.setProjectName(false));
    dispatch(actions.setSlug(false));
    if (flag('APPROVAL_THRESHOLD')) {
      fetchDashboardActions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleArchive = useCallback(
    (project) =>
      patchData('project', 'archived', {}, { pid: project.id })
        .then((result) => {
          return result.status === 200 ? result.json() : result.status;
        })
        .then(() => {
          const newProject = [...projectsList].map((p) =>
            p.id === project.id ? { ...p, status: ARCHIVED } : p,
          );
          setProjectsList(newProject);
        })
        // eslint-disable-next-line no-console
        .catch(console.error),
    [projectsList],
  );

  const handleRestore = useCallback(
    (project) =>
      patchData('project', 'restore', {}, { pid: project.id })
        .then((result) => {
          return result.status === 200 ? result.json() : result.status;
        })
        .then(() => {
          const newProject = [...projectsList].map((p) =>
            p.id === project.id ? { ...p, status: PUBLISHED } : p,
          );
          setProjectsList(newProject);
          setSlug(project.slug);
          setOpenConfirm(true);
        })
        .then(() => {
          setOpen(false);
        })
        // eslint-disable-next-line no-console
        .catch(console.error),
    [projectsList],
  );

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const sortProjects = useMemo(() => {
    switch (sortOption) {
      case 'name':
        return [...projectsList].sort((a, b) => a.name.localeCompare(b.name));
      case 'start_old':
        return [...projectsList].sort(
          (a, b) => new Date(a.start_date) - new Date(b.start_date),
        );
      case 'start_new':
        return [...projectsList].sort(
          (a, b) => new Date(b.start_date) - new Date(a.start_date),
        );
      case 'created_old':
        return [...projectsList].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at),
        );
      case 'created_new':
        return [...projectsList].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        );
      default:
        return projectsList;
    }
  }, [projectsList, sortOption]);

  const packageModalProjects = projectsList.filter(
    (project) => project.status !== ARCHIVED,
  );

  const isVisible = clinkAccount?.acl?.projectList?.canEdit ?? true;

  return loading ? (
    <>
      <Skeleton variant="text" width={210} height={118} />
      <Skeleton variant="rectangular" height={200} />
    </>
  ) : (
    <Box sx={{ width: '100%', maxWidth: 1280, mx: 'auto' }}>
      {flag('APPROVAL_THRESHOLD') &&
        flag('APPROVAL_THRESHOLD_NOTIFICATIONS') && (
          <DashboardTabs
            dashboardActions={dashboardActions}
            clinkAccount={clinkAccount}
            fetchDashboardActions={fetchDashboardActions}
            dispatchRemoveOrRestoreDashboardAction={
              dispatchRemoveOrRestoreDashboardAction
            }
          />
        )}
      <Typography fontSize={32} fontWeight={600}>
        {t('projects')}
      </Typography>
      <Box
        sx={{
          width: '100%',
          p: 0,
          mt: 1,
          backgroundColor: white,
          borderRadius: 3,
          border: `1px solid ${clinkLightPurple}`,
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <Tabs
            value={tab}
            onChange={handleTabChange}
            aria-label="Project Tabs"
            sx={{ borderBottom: `1px solid ${clinkLightPurple}` }}
          >
            <Tab label="Ongoing Projects" />
            <Tab label="Archived Projects" />
          </Tabs>

          <Box
            sx={{ px: 3, py: 2, position: 'absolute', right: 0, top: '-12px' }}
          >
            <FormControl fullWidth size="small" sx={{ width: 250 }}>
              <Select
                id="sort-projects"
                value={sortOption}
                displayEmpty
                onChange={(e) => setSortOption(e.target.value)}
              >
                <MenuItem value="name">Project Name (A-Z)</MenuItem>
                <MenuItem value="start_old">
                  Date Project Start (Oldest First)
                </MenuItem>
                <MenuItem value="start_new">
                  Date Project Start (Newest First)
                </MenuItem>
                <MenuItem value="created_old">
                  Created Date (Oldest First)
                </MenuItem>
                <MenuItem value="created_new">
                  Created Date (Newest First)
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {tab === 0 && (
          <Grid2 container spacing={3} sx={{ p: 3, borderRadius: 3 }}>

            {canCreateProject && <Grid2
              size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
              sx={{ display: isVisible ? 'block' : 'none' }}
            >
              <AddProjectV2 />
            </Grid2>}

            {sortProjects.map(
              (project) =>
                project.status !== ARCHIVED && (
                  <ProjectListItem
                    key={project.id}
                    project={project}
                    projectName={project.name}
                    archived={project.status === ARCHIVED}
                    projectType={projectType[`${project.type}`]}
                    handleArchive={handleArchive}
                    handleRestore={handleRestore}
                    imgSrc={`${BASE_URLS.S3_URL}/${ENV}/project/logo/${project.id
                      }.jpg?current=${currentDate.getTime()}`}
                    open={open}
                    setOpen={setOpen}
                    isVisible={isVisible}
                  />
                ),
            )}
          </Grid2>
        )}

        {tab === 1 && (
          <Grid2 container spacing={3} sx={{ p: 3, borderRadius: 3 }}>
            {sortProjects.map(
              (project) =>
                project.status === ARCHIVED && (
                  <ProjectListItem
                    key={project.id}
                    project={project}
                    projectName={project.name}
                    projectType={projectType[`${project.type}`]}
                    handleArchive={handleArchive}
                    handleRestore={handleRestore}
                    imgSrc={`${BASE_URLS.S3_URL}/${ENV}/project/logo/${project.id
                      }.jpg?current=${currentDate.getTime()}`}
                    open={open}
                    setOpen={setOpen}
                    isVisible={isVisible}
                  />
                ),
            )}
            {sortProjects.filter((p) => p.status === ARCHIVED).length === 0 && (
              <Grid2 item xs={12}>
                <Typography
                  variant="body1"
                  sx={{ color: mediumGray, textAlign: 'center', mt: 2 }}
                >
                  No archived projects yet.
                </Typography>
              </Grid2>
            )}
          </Grid2>
        )}

        <Modal open={open} setOpen={setOpen} />

        {openConfirm && (
          <ConfirmModal
            title={t('project-restored')}
            content={t('confirm-restore-message')}
            actionLabel={t('edit-project')}
            closeLabel={t('close')}
            handleAction={() => {
              if (slug) {
                goTo(`${BASE_URLS.CLINK}/projects/${slug}/setup`);
              }
            }}
            externalOpen={openConfirm}
          />
        )}
      </Box>
      <PackagesModal projects={packageModalProjects} />
    </Box>
  );
};

Projects.propTypes = {
  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => {
  return {
    constants: state.constants,
    dashboardActions: state.project.dashboardActions,
    clinkAccount: state.clinkAccount,
  };
};

export default connect(mapStateToProps)(Projects);
