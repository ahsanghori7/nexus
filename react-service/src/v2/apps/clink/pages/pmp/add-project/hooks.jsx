import { useState } from 'react';
import { useContext } from 'v2/hooks/context';
import { goTo } from 'v2/helpers/url';

const getCatalogueId = (ifsProjectData) => Number(ifsProjectData?.id) || 0;

const collectMissingFields = ({
  hasAsiteFoldersFeature,
  asiteFolderData,
  hasAccountGroupFeature,
  hasIfsFeature,
  catalogueId,
  projectName,
  projectReference,
  region,
  type,
  Group,
}) => {
  const missingFields = [];

  // Asite stays required even when an IFS project is selected.
  if (hasAsiteFoldersFeature && !asiteFolderData) {
    missingFields.push('asite-folder-error');
  }
  if (hasIfsFeature && catalogueId <= 0) {
    missingFields.push('ifs-project-error');
  }
  if (!projectName.trim()) missingFields.push('project-name-error');
  if (!projectReference.trim()) missingFields.push('project-reference-error');
  if (!region.trim()) missingFields.push('location-error');
  if (!type.trim()) missingFields.push('type-error');
  if (hasAccountGroupFeature && !(Group || '').trim()) {
    missingFields.push('group-error');
  }

  return missingFields;
};

const buildProjectPayload = ({
  region,
  projectReference,
  projectName,
  type,
  hasAsiteFoldersFeature,
  asiteFolderData,
  hasAccountGroupFeature,
  hasIfsFeature,
  catalogueId,
  Group,
}) => {
  const projectPayload = {
    region,
    reference: projectReference,
    name: projectName,
    type,
  };
  const hasIfsSelection = hasIfsFeature && catalogueId > 0;

  if (hasAsiteFoldersFeature && asiteFolderData) {
    projectPayload.integration_id = asiteFolderData.id;
    projectPayload.integration_name = asiteFolderData.name;
    projectPayload.integration_uri = asiteFolderData.uri;
  }


    if (hasAccountGroupFeature) {
      projectPayload.account_group_id = [Number.parseInt(Group, 10)];
    }

  if (hasIfsSelection) {
    projectPayload.partner_project_catalogue_id = catalogueId;
  }

  return projectPayload;
};

const useAddProject = (
  dispatch,
  projectData = {},
  asiteFolderData = null,
  hasAsiteFoldersFeature = false,
  hasAccountGroupFeature = false,
  hasIfsFeature = false,
  ifsProjectData = null,
) => {
  const [projectName, setProjectName] = useState(projectData?.name || '');
  const [projectReference, setProjectReference] = useState(
    projectData?.reference || '',
  );
  const [region, setRegion] = useState(projectData?.region || '');
  const [type, setType] = useState(projectData?.type || '');
  const [Group, setGroup] = useState(projectData?.group || '');

  const [errors, setErrors] = useState([]);

  const context = useContext('clink');
  const { actions } = context;

  const resetForm = () => {
    setProjectName('');
    setProjectReference('');
    setRegion('');
    setType('');
    setGroup('');
    setErrors([]);
  };

  const handleAddProject = async () => {
    const catalogueId = getCatalogueId(ifsProjectData);
    const missingFields = collectMissingFields({
      hasAsiteFoldersFeature,
      asiteFolderData,
      hasAccountGroupFeature,
      hasIfsFeature,
      catalogueId,
      projectName,
      projectReference,
      region,
      type,
      Group,
    });

    setErrors(missingFields);
    if (missingFields.length) {
      return;
    }

    const projectPayload = buildProjectPayload({
      region,
      projectReference,
      projectName,
      type,
      hasAsiteFoldersFeature,
      asiteFolderData,
      hasAccountGroupFeature,
      hasIfsFeature,
      catalogueId,
      Group,
    });

    const result = await dispatch(actions.addProject(projectPayload));
    if (result?.error) {
      setErrors([`${result?.error?.message || 'Error'} - ${result?.payload}`]);
      return;
    }
    const slug = projectName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    goTo(`/projects/${slug}/setup`);
  };

  return {
    useProjectName: [projectName, setProjectName],
    useProjectReference: [projectReference, setProjectReference],
    useLocation: [region, setRegion],
    useType: [type, setType],
    useGroup: [Group, setGroup],
    useErrors: [errors, setErrors],
    handleAddProject,
    resetForm,
  };
};

export default useAddProject;
