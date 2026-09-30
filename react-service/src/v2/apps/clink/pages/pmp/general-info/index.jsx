import React from 'react';
import i18next from 'v2/helpers/i18n';
import { connect } from 'react-redux';
import Wrapper from 'v2/apps/shared/components/wrapper-v2';
import Grid from '@mui/material/Grid2';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import useAddProject from 'v2/apps/clink/pages/pmp/add-project/hooks';
import { isIfsLinkedProject, accountHasIfsFeature } from '../ifsProjectHelpers';
import Info from './Info';
import ProjectImage from './project-image';
import useUpdateProject from './hooks';

const GeneralInfo = ({ project, dispatch, linkedIfsProject, clinkAccount }) => {
  const lockIdentityFields =
    accountHasIfsFeature(clinkAccount) &&
    isIfsLinkedProject(linkedIfsProject);
  const useAdd = useAddProject(dispatch, project?.data);
  const useUpdate = useUpdateProject(
    dispatch,
    project?.data,
    useAdd,
    lockIdentityFields,
  );
  return (
    <>
      <Wrapper
        rightContent={i18next.t('project-essentials-helper-1')}
        loading={!project?.data}
        centerContent={<ProjectImage />}
        leftContent={
          <Info useAddProject={useAdd} useUpdateProject={useUpdate} />
        }
      />
      <Wrapper
        component={Box}
        headerComponent={null}
        rightContent={<div />}
        centerContent={<div />}
        leftContent={
          project?.data && (
            <Grid container justifyContent="flex-end" spacing={2}>
              <Grid>
                <Button
                  onClick={useUpdate?.handleUpdateProject}
                  variant="contained"
                  color="primary"
                  size="large"
                  data-testid="general-info-save-button"
                >
                  {i18next.t('save')}
                </Button>
              </Grid>
            </Grid>
          )
        }
      />
    </>
  );
};

const mapStateToProps = (state) => {
  return {
    project: state.project,
    clinkAccount: state.clinkAccount,
    linkedIfsProject: state.project?.linkedIfsProject,
  };
};

export default connect(mapStateToProps)(GeneralInfo);
