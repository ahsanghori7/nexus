import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'hooks/context';

const useUpdateProject = (
  dispatch,
  projectData = {},
  addProjectData = {},
  lockIdentityFields = false,
) => {
  const navigate = useNavigate();

  const {
    useProjectName: [projectName, setProjectName],
    useProjectReference: [projectReference, setProjectReference],
    useDescription: [description, setDescription],
    useLocation: [region, setRegion],
    useType: [type, setType],
  } = addProjectData;

  const [status, setStatus] = useState(projectData?.phase || '');
  const [startDate, setStartDate] = useState(projectData?.start || null);
  const [completitionDate, setCompletitionDate] = useState(
    projectData?.end || null,
  );

  const [errors, setErrors] = useState([]);

  const context = useContext('clink');
  const { actions } = context;

  // Update state when projectData changes
  useEffect(() => {
    if (projectData && Object.keys(projectData).length > 0) {
      //add project fields
      setProjectName(projectData?.name || '');
      setProjectReference(projectData?.reference || '');
      setDescription(projectData?.description || '');
      setRegion(projectData?.region || '');
      setType(projectData?.type || '');
      // update project addons
      setStatus(projectData.phase || '');
      setStartDate(projectData.start || '');
      setCompletitionDate(projectData.end || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectData]); // Re-run effect when projectData changes

  const handleUpdateProject = async () => {
    const missingFields = [];

    if (!projectName.trim()) {
      missingFields.push('project-name-error');
    }

    if (!projectReference.trim()) missingFields.push('project-reference-error');
    if (!String(region || '').trim()) missingFields.push('location-error');
    if (!description.trim()) missingFields.push('description-error');
    if (!String(type || '').trim()) missingFields.push('type-error');
    // new items
    if (!String(status || '').trim()) missingFields.push('status-error');
    if (!String(startDate || '').trim()) missingFields.push('start-date-error');
    if (!String(completitionDate || '').trim())
      missingFields.push('end-date-error');

    setErrors(missingFields);
    if (missingFields.length) {
      return;
    }
    const result = await dispatch(
      actions.updateProject({
        data: {
          description,
          region,
          reference: lockIdentityFields
            ? projectData?.reference || projectReference
            : projectReference,
          name: lockIdentityFields
            ? projectData?.name || projectName
            : projectName,
          type,
          phase: status,
          start: startDate,
          end: completitionDate,
        },
        pid: projectData?.id,
      }),
    );
    if (result?.error) {
      setErrors([
        `${result?.error?.name || 'Error'} - ${result?.error?.message}`,
      ]);
      return;
    }
    navigate(
      `/main-contractor/projects/${
        projectData?.slug || undefined
      }/setup/project_team`,
    );
  };

  return {
    useProjectStatus: [status, setStatus],
    useStartDate: [startDate, setStartDate],
    useCompletitionDate: [completitionDate, setCompletitionDate],
    useErrors: [errors, setErrors],
    handleUpdateProject,
  };
};

export default useUpdateProject;
