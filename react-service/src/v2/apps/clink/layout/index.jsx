import React, { useEffect, useMemo, useState } from 'react';
import { PHPAppClinkGloblals } from 'v2/helpers/php-globals';
import useDeepCompareEffect from 'v2/hooks/useDeepCompareEffect';
import { getQueryStringVars } from 'v2/helpers/url';
import isEmpty from 'lodash/isEmpty';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import { CONSTANTS } from 'clink-components';
import ClinkBreadcrumbs from './ClinkBreadcrumbs';
import NavBar from './navbar';
import Sidebar from './sidebar';
import ScrollToTop from './ScrollToTop';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

const HOME = {
  label: 'Projects',
  name: 'Project',
  href: '/main-contractor',
};
const PROJECT_NAME = {
  projectName: true,
  href: '/main-contractor',
};

const WITH_PROJECT = {
  withProject: true,
  href: (slug, rest) => `/main-contractor/project/${slug}/${rest}`,
};

const PROJECT_BREADCRUMBS = [HOME, PROJECT_NAME];
const { clinkBackgroundPurple } = CONSTANTS.colors.general;
const config = PHPAppClinkGloblals();

const constextName = 'clink';

function Layout({
  noReact = false,
  project,
  company,
  layout,
  clinkAccount = {},
  children,
  dispatch,
  breadCrumbItems = [],
  title = '',
  projectName = false,
  companyName = false,
  state = null,
  isFileManager = null,
}) {
  const [open, setOpen] = useState(false);
  const [showInvalidProjectModal, setShowInvalidProjectModal] = useState(false);
  const navigate = useNavigate();
  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };
  const vars = getQueryStringVars();
  const context = useContext(constextName);
  const { slug: querySlug } = vars;
  const { actions } = context;
  const location = useLocation();

  const projectData = (project && project.data) || {};
  const subcontractorCompanyName =
    (company && company.details && company.details.name) || false;
  const params = useParams();
  const urlSlug = params && params.slug;
  const { breadcrumbs, slugHack, projectNameHack, projectLoaded } = layout;

  const isVisible = clinkAccount?.acl?.companyAssets?.canAccess ?? true;

  const slug = urlSlug || querySlug || slugHack;
  const handleCloseInvalidProjectModal = () => {
    setShowInvalidProjectModal(false);
    navigate('/main-contractor');
  };

  // Memoize the calculation of newBreadcrumbs
  const newBreadcrumbs = useMemo(() => {
    return breadCrumbItems.map((b) => {
      if (b.projectName) {
        let name = projectNameHack;
        let label = projectNameHack;
        let href = `${b.href}/project_dashboard/${slug}`;
        if (
          projectData &&
          !isEmpty(projectData) &&
          projectData.slug &&
          projectData.name
        ) {
          name = projectData.name;
          label = projectData.name;
          href = `${b.href}/project_dashboard/${projectData.slug}`;
        }
        if (name && label && href) {
          return {
            href,
            name,
            label,
          };
        }

        return {};
      }
      if (b.withProject) {
        if (slug && b.name && b.href && b.rest) {
          return {
            label: b.name,
            name: b.name,
            href: b.href(slug, b.rest),
          };
        }

        return {};
      }
      return b;
    });
    // Only recalculate if breadCrumbItems or projectData actually change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breadCrumbItems, projectData, slug]);

  useDeepCompareEffect(() => {
    dispatch(actions.setBreadcrumbs(newBreadcrumbs));
  }, [newBreadcrumbs, dispatch, location.pathname]);

  // TODO: to check performance impact of this. We need alway to use this for ProcurementScheduleOverview
  const dispatchProject = actions.fetchProjectGantt;

  useEffect(() => {
    if (
      slug &&
      (isEmpty(projectData) ||
        projectData.slug !== slug ||
        (!isEmpty(projectData) && state))
    ) {
      dispatch(dispatchProject({ slug, state, isFileManager }))
        .then((response) => {
          if (response?.payload === 403) {
            navigate('/main-contractor/404')
          }
          // Check for error in response
          if (response?.payload?.error) {
            setShowInvalidProjectModal(true);
          } else {
            dispatch(actions.setLoaded({ key: 'projectLoaded', value: true }));
          }
        })
    } else {
      dispatch(actions.setLoaded({ key: 'projectLoaded', value: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // TODO: This useEffect duplicates dispatchProject endpoint on navigation. To investigate
  useEffect(() => {
    if (!isEmpty(projectData)) {
      try {
        dispatch(actions.resetProject());
        dispatch(actions.resetQuotesTender());
        dispatch(actions.restartOrders());
        dispatch(actions.restartProcurement());
      } finally {
        if (slug) {
          dispatch(dispatchProject({ slug, state, isFileManager }));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, slug]);

  let newTitle = title;
  if (projectName && projectData && projectData.name) {
    newTitle = projectData.name;
  } else if (companyName && subcontractorCompanyName) {
    newTitle = subcontractorCompanyName;
  } else if (!title && projectNameHack) {
    newTitle = projectNameHack;
  }

  const noReactStyle = noReact ? { display: 'none' } : {};
  return (
    <>
      <NavBar toggleDrawer={toggleDrawer} noReact={noReact} />
      {!config.isCostPlaningTool && (
        <Sidebar isVisible={isVisible} useSidebar={[open, toggleDrawer]} noReact={noReact} />
      )}
      <Box
        sx={{
          backgroundColor: noReact ? 'transparent' : clinkBackgroundPurple,
          pt: '24px',
          ...noReactStyle,
        }}
      >
        <Container maxWidth={false}>
          <ClinkBreadcrumbs
            items={breadcrumbs}
            loaded={projectLoaded}
            title={newTitle}
          />
          {children}
        </Container>
      </Box>
      <Modal open={showInvalidProjectModal} onClose={handleCloseInvalidProjectModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            minWidth: 300,
          }}
        >
          <Typography variant="h6" gutterBottom>
            This project could not be found. Please check the URL or select a valid project.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              className="btn-inverted"
              onClick={handleCloseInvalidProjectModal}>
              Close
            </Button>
          </Box>
        </Box>
      </Modal>
      <ScrollToTop />
    </>
  );
}

const mapStateToProps = (state) => {
  return {
    project: state.project,
    company: state.company,
    layout: state.layout,
    clinkAccount: state.clinkAccount
  };
};

export default connect(mapStateToProps)(Layout);
export { HOME, PROJECT_NAME, PROJECT_BREADCRUMBS, WITH_PROJECT };
