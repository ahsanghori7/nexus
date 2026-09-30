import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';
import { patchData } from 'services/clinkHelpers';
import 'v1/global';
import 'v1/projects/public/styles/index.scss';
import Relay from 'v1/global/services/Relay';
import ConfirmModal from 'v2/apps/shared/components/confirm-modal/v3';
import ProjectsPanel from './project-panel';
import PackagesModal from 'v1/global/components/packages-modal';
import { goTo } from 'v2/helpers/url';

const PUBLISH = 1;
const PRIVATE = 2;
const contextType = 'clink';

const Projects = ({ dispatch, constants }) => {
  const { t } = useTranslation();
  const [openConfirm, setOpenConfirm] = useState(false);
  const [slug, setSlug] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const context = useContext(contextType);
  const { actions } = context;

  const projectType = constants?.project?.type || [];

  useEffect(() => {
    const projectList = new Relay('project', 'getAll');
    projectList.getJson().then((data) => {
      setProjects(data || []);
      setLoading(false);
      setFailed(false);
    });
    dispatch(actions.resetProject());
    dispatch(actions.resetQuotesTender());
    dispatch(actions.restartOrders());
    dispatch(actions.restartProcurement());
    dispatch(actions.setProjectName(false));
    dispatch(actions.setSlug(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleArchive = (project) =>
    patchData('project', 'archived', {}, { pid: project.id })
      .then((result) => {
        return result.status === 200 ? result.json() : result.status;
      })
      .then(() => {
        const newProject = [...projects].map((p) =>
          p.id === project.id ? { ...p, status: PRIVATE } : p,
        );
        setProjects(newProject);
      })
      // eslint-disable-next-line no-console
      .catch(console.error);

  const handleRestore = (project) =>
    patchData('project', 'restore', {}, { pid: project.id })
      .then((result) => {
        return result.status === 200 ? result.json() : result.status;
      })
      .then(() => {
        const newProject = [...projects].map((p) =>
          p.id === project.id ? { ...p, status: PUBLISH } : p,
        );
        setProjects(newProject);
        setSlug(project.slug);
        setOpenConfirm(true);
      })
      // eslint-disable-next-line no-console
      .catch(console.error);

  const packageModalProjects = projects.filter(
    (project) => project.status !== PRIVATE,
  );
  return loading ? (
    <>
      <Skeleton variant="text" width={210} height={118} />
      <Skeleton variant="rectangular" />
    </>
  ) : (
    <Box sx={{ background: 'white' }} className="dashboard-projects">
      <ProjectsPanel
        projects={projects}
        projectType={projectType}
        loading={loading}
        failed={failed}
        handleArchive={handleArchive}
        handleRestore={handleRestore}
      />
      <PackagesModal projects={packageModalProjects} />
      {openConfirm && (
        <ConfirmModal
          title={t('project-restored')}
          content={t('confirm-restore-message')}
          actionLabel={t('edit-project')}
          closeLabel={t('close')}
          handleAction={() => {
            if (slug) {
              goTo(`${BASE_URLS.CLINK}/project/${slug}/edit_project`);
            }
          }}
          externalOpen={openConfirm}
        />
      )}
    </Box>
  );
};

Projects.propTypes = {
  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => {
  return {
    constants: state.constants,
  };
};

export default connect(mapStateToProps)(Projects);
