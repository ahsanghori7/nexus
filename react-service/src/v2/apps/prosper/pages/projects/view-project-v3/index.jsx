import React, { useEffect, useState } from 'react';
import Subscription from 'v2/helpers/user/subscription';
import { connect } from 'react-redux';
import { useParams, useLocation } from 'react-router-dom';
import { useContext } from 'hooks/context';
import Loading from 'v2/apps/shared/components/Loading';
import { CONSTANTS } from 'clink-components';
import {
  checkIfImageExists,
  getProjectLogo,
  getQueryStringVars,
  goTo,
} from 'v2/helpers/url';
import { analytics } from 'services/helpers';
import ProjectDetails from './project-details';
import Packages from './packages';
import Lock from './Lock';

const { prosperPackagesDefault } = CONSTANTS.s3;

const subscriptionHelper = new Subscription();
const checkToken = (subcontractor = {}) =>
  subcontractor &&
  subscriptionHelper.isTokenUser(subcontractor.subscription_id);

const checkProjectAccess = (
  pid = 0,
  unlockedProjects = [],
  subcontractor = {},
) => {
  if (!checkToken(subcontractor)) {
    return true;
  }
  return pid && unlockedProjects.length
    ? unlockedProjects.map((num) => Number(num)).includes(Number(pid))
    : false;
};

const ViewProjectV3 = ({ opportunities, account, subcontractor, dispatch }) => {
  const params = useParams();
  const {
    unlocked_projects,
    token_prices: tokenPrices,
    membership,
  } = subcontractor;
  const tokens = (membership && membership.tokens) || 0;
  const [open, setOpen] = useState(
    !checkProjectAccess(params.projectId, unlocked_projects, subcontractor),
  );
  const [imageExists, setImageExists] = useState(false);
  const { project, statusProject } = opportunities;
  const { account: clientData, distance } = account;
  const context = useContext(BASE_DIRS.V2.PROSPER);
  const { actions, pages } = context;
  const {
    home,
    opportunities: opportunitiesPage,
    unlockedProjects,
    registeredInterests,
  } = pages;

  const location = useLocation();
  const pathArray = location.pathname.split('/');
  const numberPart = pathArray[pathArray.length - 1];

  // TODO: Investigate why this is happening for comision users
  if (
    isNaN(numberPart) &&
    !String(numberPart).includes('registered-interests')
  ) {
    goTo(`${BASE_URLS.PROSPER}/dashboard/404`);
    return null;
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    dispatch(actions.setLock(open));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    dispatch(actions.fetchSingleProject(params.projectId));

    checkIfImageExists(getProjectLogo(params.projectId), (exists) => {
      setImageExists(exists);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    setOpen(
      !checkProjectAccess(params.projectId, unlocked_projects, subcontractor),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subcontractor]);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (project && unlocked_projects && unlocked_projects.length) {
      dispatch(
        actions.fetchCompanyData({
          id: project.group_id,
          pid: params.projectId,
        }),
      );
      dispatch(
        actions.distance({
          projects: [project.id],
        }),
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, unlocked_projects]);

  const handleRegister = async (packId) => {
    if (!open) {
      // we trigger the get subcontractor information to avoid registering when having 0 tokens
      const dispatchChaining = async () => {
        await Promise.all([
          dispatch(actions.updateRegisteredProject({ tid: packId })),
        ]);
        return true;
      };
      await dispatchChaining();
      dispatch(actions.fetchSingleProject(params.projectId));
    }
    return null;
  };

  const handleUnlockProject = (pid) =>
    analytics(
      'history.project.unlocked',
      project.author_id,
      project.group_id,
      () => dispatch(actions.unlockProject(pid)),
    );

  let breadcrumbsPath = opportunitiesPage;
  const vars = getQueryStringVars();
  if ('unlocked_projects' in vars) {
    breadcrumbsPath = !checkToken(subcontractor)
      ? registeredInterests
      : unlockedProjects;
  }

  const loading =
    statusProject || (subcontractor && !subcontractor.id && 'Loading...');
  const hasRegistered =
    project &&
    project.packages &&
    project.packages.reduce(
      (accumulator, currentValue) => accumulator || currentValue.registered,
      false,
    );

  return (
    <>
      <Loading status={loading} />
      {!loading && project && (
        <>
          <Lock
            pid={params.projectId}
            open={open}
            tokens={tokens}
            tokenPrices={tokenPrices}
            setOpen={setOpen}
            subcontractor={subcontractor}
            unlockProject={handleUnlockProject}
            reduceInfoToken={() => dispatch(actions.reduceInfoToken())}
            claimToken={() => dispatch(actions.claimToken())}
            isTokenUser={checkToken(subcontractor)}
            canClaimFreeTokens={subcontractor.canClaimFreeTokens}
          />
          <ProjectDetails
            breadcrumbsItems={[home, breadcrumbsPath]}
            subcontractor={subcontractor}
            clientData={clientData}
            open={open}
            hasRegistered={hasRegistered}
            project={project}
            distance={distance}
            src={
              imageExists
                ? getProjectLogo(params.projectId)
                : prosperPackagesDefault
            }
          />
          <Packages
            unlocked={checkProjectAccess(
              params.projectId,
              unlocked_projects,
              subcontractor,
            )}
            project={project}
            subcontractor={subcontractor}
            handleRegister={handleRegister}
            open={open}
          />
        </>
      )}
    </>
  );
};

const mapStateToProps = (state) => {
  return {
    opportunities: state.opportunities,
    subcontractor: state.subcontractor,
    account: state.account,
    config: state.config,
  };
};

export default connect(mapStateToProps)(ViewProjectV3);
