import React, { useState } from 'react';
import Panel from '../../../global/components/layout/panel';
import ProjectList from './ProjectList';
import ProjectHeader, {
  START_OLDEST,
  START_NEWEST,
  CREATED_OLDEST,
  CREATED_NEWEST,
  NAME,
} from './ProjectHeader';

// TODO: retrieve these from the API
const PENDING = 0;
const PUBLISH = 1;
const PRIVATE = 2;
const DRAFT = 3;
const ONGOING = [PENDING, PUBLISH, DRAFT];
const ARCHIVED = [PRIVATE];

const sortMapping = {
  [NAME]: (data) =>
    data.sort((projectA, projectB) =>
      projectA.name.toLowerCase().localeCompare(projectB.name.toLowerCase()),
    ),
  [START_NEWEST]: (data) =>
    data.sort((a, b) => {
      // descending
      const dateA = new Date(a.start);
      const dateB = new Date(b.start);
      return dateB - dateA;
    }),
  [START_OLDEST]: (data) =>
    data.sort((a, b) => {
      // ascending
      const dateA = new Date(a.start);
      const dateB = new Date(b.start);
      return dateA - dateB;
    }),
  [CREATED_NEWEST]: (data) =>
    data.sort((a, b) => {
      // descending
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB - dateA;
    }),
  [CREATED_OLDEST]: (data) =>
    data.sort((a, b) => {
      // ascending
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateA - dateB;
    }),
};

const ProjectsPanel = ({
  projects = [],
  projectType = [],
  loading = true,
  failed = false,
  handleArchive = () => null,
  handleRestore = () => null,
}) => {
  const [value, setValue] = useState(0);
  const [sort, setSort] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  const handleSortChange = (event) => {
    setSort(event.target.value);
  };

  let filteredProjects = [...projects];
  filteredProjects = projects.filter((project) =>
    [...(value ? ARCHIVED : ONGOING)].includes(Number(project.status)),
  );
  filteredProjects = sortMapping[sort](filteredProjects);

  return (
    <Panel
      className="project-panel-wrapper"
      header={
        <ProjectHeader
          useTab={[value, handleChange]}
          useSort={[sort, handleSortChange]}
        />
      }
    >
      <ProjectList
        projects={filteredProjects}
        projectType={projectType}
        loading={loading}
        failed={failed}
        isArchivedTab={!value}
        handleArchive={handleArchive}
        handleRestore={handleRestore}
      />
    </Panel>
  );
};

export default ProjectsPanel;
