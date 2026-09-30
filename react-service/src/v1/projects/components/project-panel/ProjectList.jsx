import React, { useState } from 'react';
import { Alert } from 'react-bootstrap';
import Grid from '@mui/material/Grid';
// TODO: Extract modal work for global V1/V2 components
import Modal from 'v2/apps/clink/pages/orders/subcontractors/modal';
import AddProjectV2 from 'v2/apps/clink/pages/pmp/add-project';
import Loading from 'v1/global/components/Loading';
import ProjectListItem from './project-list-item';

const ProjectList = ({
  projects = [],
  projectType = [],
  loading = true,
  failed = false,
  isArchivedTab = true,
  handleArchive = () => null,
  handleRestore = () => null,
}) => {
  const [open, setOpen] = useState(false);
  const currentDate = new Date();
  return (
    <Grid container>
      {loading && <Loading />}
      <Modal open={open} setOpen={setOpen} />
      {!loading && !failed && (
        <>
          {isArchivedTab && <AddProjectV2 />}
          {projects?.length > 0 &&
            projects.map((project) => (
              <ProjectListItem
                key={project.id}
                image={`${BASE_URLS.S3_URL}/${ENV}/project/logo/${project.id
                  }.jpg?current=${currentDate.getTime()}`}
                projectName={project.name}
                projectType={projectType[`${project.type}`]}
                href={`${BASE_URLS.CLINK_APP_HOST}/main-contractor/project_dashboard/${project.slug}`}
                setOpen={setOpen}
                archived={isArchivedTab}
                handleArchive={handleArchive}
                handleRestore={handleRestore}
                project={project}
              />
            ))}
        </>
      )}
      {failed && (
        <Alert variant="danger">
          An error ocurred while fetching the form data.
        </Alert>
      )}
    </Grid>
  );
};

export default ProjectList;
