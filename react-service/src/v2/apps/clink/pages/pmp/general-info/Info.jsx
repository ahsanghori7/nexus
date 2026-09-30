import React, { useEffect, useMemo } from 'react';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Grid2 from '@mui/material/Grid2';
import { CONSTANTS } from 'clink-components';
import i18next from 'v2/helpers/i18n';
import TextField from '@mui/material/TextField';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { connect } from 'react-redux';
import MenuItem from '@mui/material/MenuItem';
import capitalize from 'lodash/capitalize';
import { useContext } from 'hooks/context';
import dayjs from 'dayjs';
import IfsLinkedProjectInfo from './IfsLinkedProjectInfo';
import { isIfsLinkedProject, readOnlyIfsFieldSx, accountHasIfsFeature } from '../ifsProjectHelpers';

const { lightPeriwinkle } = CONSTANTS.colors.general;

const DatePickerField = ({ label, value, onChange, testId }) => (
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <DatePicker
      required
      format="DD/MM/YYYY"
      label={label}
      onChange={(e) => onChange(e.format('YYYY-MM-DD'))}
      value={dayjs(value)}
      slotProps={{
        textField: { inputProps: { 'data-testid': testId } },
      }}
    />
  </LocalizationProvider>
);

const SelectField = ({
  errorKey,
  errors,
  testIdInput,
  testIdDropdown,
  label,
  value,
  onChange,
  options,
  sorted,
}) => {
  const items = sorted
    ? [...options].sort((a, b) => a.label.localeCompare(b.label))
    : options;

  return (
    <TextField
      error={errors && Boolean(errors?.find((e) => e === errorKey))}
      slotProps={{
        htmlInput: { 'data-testid': testIdInput },
        select: { 'data-testid': testIdDropdown },
      }}
      label={label}
      fullWidth
      required
      select
      variant="outlined"
      value={value}
      onChange={onChange}
    >
      {items.map((option) => (
        <MenuItem key={option.id} value={option.id}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
};

const Info = ({
  constants,
  dispatch,
  useAddProject,
  useUpdateProject,
  attributes,
  clinkAccount,
  linkedIfsProject,
  projectId,
}) => {
  const {
    useProjectName,
    useProjectReference,
    useDescription,
    useLocation,
    useType,
  } = useAddProject;

  const [projectName, setProjectName] = useProjectName;
  const [projectReference, setProjectReference] = useProjectReference;
  const [description, setDescription] = useDescription;
  const [region, setRegion] = useLocation;
  const [type, setType] = useType;

  const {
    useProjectStatus,
    useStartDate,
    useCompletitionDate,
    useErrors: useUpdateProjectErrors,
  } = useUpdateProject;

  const [errors] = useUpdateProjectErrors;

  const [projectStatus, setProjectStatus] = useProjectStatus;
  const [startDate, setStartDate] = useStartDate;
  const [endDate, setEndDate] = useCompletitionDate;

  const context = useContext('clink');
  const { actions } = context;

  const hasIfsFeature = accountHasIfsFeature(clinkAccount);
  const nameReferenceReadOnly =
    hasIfsFeature && isIfsLinkedProject(linkedIfsProject);

  useEffect(() => {
    if (!hasIfsFeature || !projectId) {
      return undefined;
    }
    dispatch(actions.fetchLinkedIfsProject(projectId));
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasIfsFeature, projectId]);

  useEffect(() => {
    if (!constants?.project?.type) {
      dispatch(actions.fetchConstants());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [constants?.project?.type]);

  useEffect(() => {
    if (!attributes?.regions?.length) {
      dispatch(actions.fetchAttrRegions());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attributes?.regions?.length]);

  const typeArray = useMemo(() => {
    return Object.entries(constants?.project?.type || {}).map(
      ([key, value]) => ({
        id: key,
        label: value,
      }),
    );
  }, [constants?.project?.type]);

  const phaseArray = useMemo(() => {
    return Object.entries(constants?.project?.phase || {}).map(
      ([key, value]) => ({
        id: key,
        label: value,
      }),
    );
  }, [constants?.project?.phase]);

  const regionOptions = useMemo(
    () => (attributes?.regions || []).map((r) => ({ id: r.id, label: r.label })),
    [attributes?.regions],
  );

  return (
    <Grid2
      size={{ xs: 12, md: 4 }}
      sx={{ width: '100% !important' }}
      container
      flexDirection="column"
    >
      <Grid2 borderBottom={`1px solid ${lightPeriwinkle}`} p={1.75}>
        <Typography sx={{ fontWeight: 600 }}>
          {i18next.t('project-overview')}
        </Typography>
      </Grid2>
      {errors.length > 0 && (
        <Grid2 p={1.75}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.map((error) => (
              <Typography key={error} variant="body2">
                {i18next.t(error)}
              </Typography>
            ))}
          </Alert>
        </Grid2>
      )}
      <Grid2 p={1.75} container spacing={2}>
        {hasIfsFeature && (
          <IfsLinkedProjectInfo
            linkedProject={linkedIfsProject?.data}
            loading={linkedIfsProject?.loading}
          />
        )}
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            error={errors && Boolean(errors?.find((e) => e === 'project-name-error'))}
            slotProps={{
              htmlInput: { 'data-testid': 'general-info-project-name-input' },
              input: { readOnly: nameReferenceReadOnly },
            }}
            label={i18next.t('project-name')}
            variant="outlined"
            fullWidth
            required
            value={projectName}
            onChange={
              nameReferenceReadOnly
                ? undefined
                : (e) => setProjectName(e.target.value)
            }
            sx={nameReferenceReadOnly ? readOnlyIfsFieldSx : undefined}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            error={
              errors &&
              Boolean(errors?.find((e) => e === 'project-reference-error'))
            }
            slotProps={{
              htmlInput: { 'data-testid': 'general-info-project-reference-input' },
              input: { readOnly: nameReferenceReadOnly },
            }}
            label={i18next.t('project-reference')}
            fullWidth
            required
            variant="outlined"
            value={projectReference}
            onChange={
              nameReferenceReadOnly
                ? undefined
                : (e) => setProjectReference(e.target.value)
            }
            sx={nameReferenceReadOnly ? readOnlyIfsFieldSx : undefined}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <DatePickerField
            label={i18next.t('start-date')}
            value={startDate}
            onChange={setStartDate}
            testId="general-info-start-date-input"
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <DatePickerField
            label={i18next.t('end-date')}
            value={endDate}
            onChange={setEndDate}
            testId="general-info-end-date-input"
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <SelectField
            errorKey="location-error"
            errors={errors}
            testIdInput="general-info-location-select"
            testIdDropdown="general-info-location-select-dropdown"
            label={capitalize(i18next.t('label-location'))}
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            options={regionOptions}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <SelectField
            errorKey="type-error"
            errors={errors}
            testIdInput="general-info-type-select"
            testIdDropdown="general-info-type-select-dropdown"
            label={capitalize(i18next.t('type'))}
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={typeArray}
            sorted
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <SelectField
            errorKey="status-error"
            errors={errors}
            testIdInput="general-info-status-select"
            testIdDropdown="general-info-status-select-dropdown"
            label={capitalize(i18next.t('status'))}
            value={projectStatus}
            onChange={(e) => setProjectStatus(e.target.value)}
            options={phaseArray}
          />
        </Grid2>
        <Grid2 size={12}>
          <TextField
            error={
              errors && Boolean(errors?.find((e) => e === 'description-error'))
            }
            slotProps={{
              htmlInput: { 'data-testid': 'general-info-description-input' },
            }}
            required
            label={capitalize(i18next.t('profile-description'))}
            fullWidth
            multiline
            minRows={4}
            maxRows={10}
            variant="outlined"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Grid2>
      </Grid2>
    </Grid2>
  );
};

const mapStateToProps = (state) => {
  return {
    constants: state.constants,
    attributes: state.attributes,
    clinkAccount: state.clinkAccount,
    linkedIfsProject: state.project?.linkedIfsProject,
    projectId: state.project?.data?.id,
  };
};

export default connect(mapStateToProps)(Info);
