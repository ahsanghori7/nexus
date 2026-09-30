import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { connect } from 'react-redux';
import capitalize from 'lodash/capitalize';
import debounce from 'lodash/debounce';
import { useContext } from 'hooks/context';
import Box from '@mui/material/Box';
import Grid2 from '@mui/material/Grid2';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import i18next from 'v2/helpers/i18n';
import AsyncAutocomplete from 'v2/apps/shared/components/select/AsyncAutocomplete';
import { modalBoxStyle, modalHeaderStyle, modalBodyStyle } from './Item.style';
import Panel from './Panel';
import useAddProject from './hooks';
import { AsiteGuide, AsiteGuideTrigger } from './AsiteGuide';
import { getIfsOptionLabel, readOnlyIfsFieldSx, accountHasIfsFeature } from '../ifsProjectHelpers';

export { getIfsOptionLabel };

/**
 * Asite selection always stores the folder id. Name/reference are only
 * copied from Asite when no IFS project is selected — IFS values must win.
 */
export const applyAsiteFolderSelection = (
  selectedOption,
  lockIdentityFields,
  { setAsiteFolder, setProjectName, setProjectReference },
) => {
  setAsiteFolder(selectedOption?.id || '');
  if (lockIdentityFields) {
    return;
  }
  setProjectName(selectedOption?.name || '');
  setProjectReference(selectedOption?.name || '');
};

const IFS_PER_PAGE = 15;

const AddNewProjectV2 = ({
  constants,
  dispatch,
  attributes,
  account,
  clinkAccount,
  ifsProjects,
}) => {
  const [open, setOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [asiteFolder, setAsiteFolder] = useState('');
  const [selectedIfsProject, setSelectedIfsProject] = useState(null);
  const [ifsInputValue, setIfsInputValue] = useState('');

  const context = useContext('clink');
  const { actions } = context;

  const hasAsiteFoldersFeature =
    clinkAccount?.featureFlags?.asiteFolders || false;
  const hasAccountGroupFeature =
    clinkAccount?.featureFlags?.accountGroup || false;
  const hasIfsFeature = accountHasIfsFeature(clinkAccount);

  const selectedAsiteFolder = useMemo(() => {
    if (!asiteFolder || !attributes?.asiteFolders) return null;
    return attributes?.asiteFolders.find(
      (folder) => folder?.id === asiteFolder,
    );
  }, [asiteFolder, attributes?.asiteFolders]);

  const {
    useProjectName,
    useProjectReference,
    useLocation,
    useType,
    useGroup,
    useErrors,
    handleAddProject,
    resetForm,
  } = useAddProject(
    dispatch,
    {},
    selectedAsiteFolder,
    hasAsiteFoldersFeature,
    hasAccountGroupFeature,
    hasIfsFeature,
    selectedIfsProject,
  );

  const [projectName, setProjectName] = useProjectName;
  const [projectReference, setProjectReference] = useProjectReference;
  const [region, setRegion] = useLocation;
  const [type, setType] = useType;
  const [Group, setGroup] = useGroup;
  const [errors, setErrors] = useErrors;

  const ifsRecords = useMemo(
    () => ifsProjects?.records || [],
    [ifsProjects?.records],
  );
  const ifsTotal = ifsProjects?.total || 0;
  const ifsPage = ifsProjects?.page || 1;
  const ifsLoading = ifsProjects?.loading || false;
  const ifsLoadingMore = ifsProjects?.loadingMore || false;
  const ifsError = ifsProjects?.error;
  const ifsSearch = ifsProjects?.search || '';
  const nameReferenceReadOnly = hasIfsFeature && Boolean(selectedIfsProject);

  const ifsOptions = useMemo(() => {
    if (
      !selectedIfsProject?.id ||
      ifsRecords.some((record) => record?.id === selectedIfsProject.id)
    ) {
      return ifsRecords;
    }
    return [selectedIfsProject, ...ifsRecords];
  }, [ifsRecords, selectedIfsProject]);

  useEffect(() => {
    dispatch(actions.fetchAttrRegions());
    dispatch(actions.fetchConstants());
    if (hasAccountGroupFeature) {
      dispatch(actions.fetchGroups(clinkAccount?.id));
    }

    if (hasAsiteFoldersFeature) {
      dispatch(actions.fetchAsiteFolders());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAsiteFoldersFeature, hasAccountGroupFeature, clinkAccount?.id]);

  const debouncedFetchIfsProjects = useMemo(
    () =>
      debounce((search) => {
        dispatch(
          actions.fetchIfsProjects({
            search,
            page: 1,
            per_page: IFS_PER_PAGE,
          }),
        );
      }, 400),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, actions],
  );

  useEffect(() => {
    return () => {
      debouncedFetchIfsProjects.cancel();
    };
  }, [debouncedFetchIfsProjects]);

  const handleClick = (e) => {
    e.preventDefault();
    setOpen(true);
  };

  const resetIfsFormState = useCallback(() => {
    setSelectedIfsProject(null);
    setIfsInputValue('');
    if (hasIfsFeature) {
      dispatch(actions.resetIfsProjects());
    }
  }, [actions, dispatch, hasIfsFeature]);

  const handleDismiss = () => {
    setOpen(false);
    resetForm();
    setAsiteFolder('');
    setShowGuide(false);
  };

  const handleCancel = () => {
    setOpen(false);
    setShowGuide(false);
    setErrors([]);
    setAsiteFolder('');
    setProjectName('');
    setProjectReference('');
    setRegion('');
    setType('');
    resetIfsFormState();
  };

  useEffect(() => {
    if (open && hasIfsFeature) {
      dispatch(
        actions.fetchIfsProjects({
          search: '',
          page: 1,
          per_page: IFS_PER_PAGE,
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, hasIfsFeature]);

  const loadMoreIfsProjects = useCallback(() => {
    if (
      ifsLoading ||
      ifsLoadingMore ||
      ifsRecords.length >= ifsTotal ||
      ifsRecords.length === 0
    ) {
      return;
    }
    dispatch(
      actions.fetchIfsProjects({
        search: ifsSearch,
        page: ifsPage + 1,
        per_page: IFS_PER_PAGE,
      }),
    );
  }, [
    actions,
    dispatch,
    ifsLoading,
    ifsLoadingMore,
    ifsPage,
    ifsRecords.length,
    ifsSearch,
    ifsTotal,
  ]);

  const handleIfsChange = (_, selectedOption) => {
    setSelectedIfsProject(selectedOption);
    if (selectedOption) {
      setProjectName(selectedOption.project_name || '');
      setProjectReference(selectedOption.project_code || '');
      setGroup(selectedOption.business_unit_name || '');
      setIfsInputValue(getIfsOptionLabel(selectedOption));
      setShowGuide(false);
    } else {
      setProjectName('');
      setProjectReference('');
      setGroup('');
      setIfsInputValue('');
    }
  };

  const handleAsiteChange = (_, selectedOption) => {
    applyAsiteFolderSelection(selectedOption, nameReferenceReadOnly, {
      setAsiteFolder,
      setProjectName,
      setProjectReference,
    });
  };

  const typeArray = useMemo(() => {
    return Object.entries(constants?.project?.type || {}).map(
      ([key, value]) => ({
        id: key,
        label: value,
      }),
    );
  }, [constants?.project?.type]);

  const groupArray = useMemo(() => {
    return account?.groups || [];
  }, [account?.groups]);

  const isSaveEnabled = useMemo(() => {
    const coreValid =
      projectName.trim() !== '' &&
      projectReference.trim() !== '' &&
      Boolean(region) &&
      Boolean(type) &&
      (!hasAccountGroupFeature || Boolean(Group));
    if (hasAsiteFoldersFeature) {
      return coreValid && Boolean(asiteFolder);
    }
    return coreValid;
  }, [
    projectName,
    projectReference,
    region,
    type,
    Group,
    hasAccountGroupFeature,
    hasAsiteFoldersFeature,
    asiteFolder,
  ]);

  return (
    <>
      <Panel handleClick={handleClick} />
      <Modal open={open} onClose={handleDismiss}>
        <Box sx={modalBoxStyle}>
          {/* Modal Head */}
          <Box
            sx={{
              ...modalHeaderStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography
              variant="h6"
              component="h2"
              sx={{ fontWeight: 'bold', fontSize: '18px' }}
            >
              {i18next.t('add-new-project')}
            </Typography>
            <IconButton aria-label="close" onClick={handleCancel} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Modal Body */}
          <Box sx={modalBodyStyle}>
            {errors.length > 0 && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errors.map((error) => (
                  <Typography key={error} variant="body2">
                    {i18next.t(error)}
                  </Typography>
                ))}
              </Alert>
            )}

            {/* Section: Project Information */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              {i18next.t('project-information')}
            </Typography>
            {hasIfsFeature && (
              <Box sx={{ mb: 3 }}>
                <AsyncAutocomplete
                  options={ifsOptions}
                  value={selectedIfsProject}
                  inputValue={ifsInputValue}
                  loading={ifsLoading}
                  loadingMore={ifsLoadingMore}
                  getOptionLabel={getIfsOptionLabel}
                  onChange={handleIfsChange}
                  onSearch={debouncedFetchIfsProjects}
                  onLoadMore={loadMoreIfsProjects}
                  onInputChange={(_, value, reason) => {
                    if (reason === 'input' || reason === 'clear') {
                      setIfsInputValue(value);
                    }
                  }}
                  label={i18next.t('ifs-project')}
                  required
                  error={Boolean(errors?.find((e) => e === 'ifs-project-error'))}
                  helperText={
                    ifsError ? i18next.t('ifs-project-load-error') : undefined
                  }
                  noOptionsText={
                    ifsError
                      ? i18next.t('ifs-project-load-error')
                      : i18next.t('ifs-project-empty')
                  }
                />
              </Box>
            )}

            {hasAsiteFoldersFeature && (
              <Grid2
                container
                justifyContent="space-between"
                alignItems="center"
                spacing={2}
                mb={3}
              >
                <Grid2 size={6}>
                  <Autocomplete
                    data-testid="asite-folders-autocomplete"
                    fullWidth
                    options={
                      attributes?.asiteFolders?.filter(
                        (option) => option?.id && option?.name,
                      ) || []
                    }
                    value={
                      attributes?.asiteFolders?.find(
                        (option) => option?.id === asiteFolder,
                      ) || null
                    }
                    onChange={handleAsiteChange}
                    getOptionLabel={(option) => option?.name || ''}
                    isOptionEqualToValue={(option, value) =>
                      option?.id === value?.id
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={i18next.t('asite-folders')}
                        variant="outlined"
                        required
                        error={
                          errors &&
                          Boolean(
                            errors?.find((e) => e === 'asite-folder-error'),
                          )
                        }
                      />
                    )}
                  />
                </Grid2>
                <Grid2 size={6} sx={{ textAlign: 'right' }}>
                  <AsiteGuideTrigger onClick={() => setShowGuide(!showGuide)} />
                </Grid2>
                <Grid2 size={12}>
                  <AsiteGuide
                    open={showGuide}
                    onClose={() => setShowGuide(false)}
                  />
                </Grid2>
              </Grid2>
            )}

            <Box sx={{ mb: 3 }}>
              <TextField
                error={
                  errors &&
                  Boolean(errors?.find((e) => e === 'project-name-error'))
                }
                slotProps={{
                  htmlInput: {
                    'data-testid': 'add-project-name-input',
                  },
                  input: { readOnly: nameReferenceReadOnly },
                }}
                label={i18next.t('project-name')}
                variant="outlined"
                fullWidth
                required
                autoFocus
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                sx={nameReferenceReadOnly ? readOnlyIfsFieldSx : undefined}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <TextField
                error={
                  errors &&
                  Boolean(errors?.find((e) => e === 'project-reference-error'))
                }
                label={i18next.t('project-reference')}
                fullWidth
                required
                variant="outlined"
                value={projectReference}
                onChange={(e) => setProjectReference(e.target.value)}
                slotProps={{
                  htmlInput: {
                    'data-testid': 'add-project-reference-input',
                  },
                  input: { readOnly: nameReferenceReadOnly },
                }}
                sx={nameReferenceReadOnly ? readOnlyIfsFieldSx : undefined}
              />
            </Box>

            <Grid2 container spacing={2} sx={{ mb: 3 }}>
              <Grid2 size={6}>
                <TextField
                  slotProps={{
                    htmlInput: {
                      'data-testid': 'add-project-location-select',
                    },
                    select: {
                      'data-testid': 'add-project-location-select-dropdown',
                    },
                  }}
                  error={
                    errors &&
                    Boolean(errors?.find((e) => e === 'location-error'))
                  }
                  label={capitalize(i18next.t('label-location'))}
                  fullWidth
                  required
                  select
                  variant="outlined"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                >
                  {attributes?.regions?.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid2>
              <Grid2 size={6}>
                <TextField
                  slotProps={{
                    htmlInput: {
                      'data-testid': 'add-project-type-select',
                    },
                    select: {
                      'data-testid': 'add-project-type-select-dropdown',
                    },
                  }}
                  error={
                    errors && Boolean(errors?.find((e) => e === 'type-error'))
                  }
                  label={capitalize(i18next.t('type'))}
                  fullWidth
                  required
                  select
                  variant="outlined"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {[...typeArray]
                    .sort((a, b) => a.label.localeCompare(b.label))
                    .map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.label}
                      </MenuItem>
                    ))}
                </TextField>
              </Grid2>
            </Grid2>

            {/* Section: Group — gated on the ACCOUNT_GROUP feature flag */}
            {hasAccountGroupFeature && (
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  {i18next.t('group')}
                  <Box component="span" sx={{ color: 'error.main' }}>
                    {' '}
                    *
                  </Box>
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <TextField
                    slotProps={{
                      htmlInput: {
                        'data-testid': 'add-project-group-select',
                      },
                      // `displayEmpty` is what lets the empty-valued "Select a
                      // Group" option render as the default selection; without
                      // it MUI draws a blank field and the label drops onto it.
                      select: {
                        'data-testid': 'add-project-group-select-dropdown',
                        displayEmpty: true,
                      },
                      inputLabel: { shrink: true },
                    }}
                    error={
                      errors &&
                      Boolean(errors?.find((e) => e === 'group-error'))
                    }
                    required
                    label={i18next.t('select-a-group')}
                    fullWidth
                    select
                    disabled={nameReferenceReadOnly}
                    variant="outlined"
                    value={Group}
                    onChange={(e) => setGroup(e.target.value)}
                  >
                    <MenuItem value="">{i18next.t('select-group')}</MenuItem>
                    {nameReferenceReadOnly && Group && (
                      <MenuItem value={Group}>{Group}</MenuItem>
                    )}
                    {!nameReferenceReadOnly &&
                      [...groupArray]
                        .sort((a, b) => a.label.localeCompare(b.label))
                        .map((option) => (
                          <MenuItem key={option.id} value={option.id}>
                            {option.label}
                          </MenuItem>
                        ))}
                  </TextField>
                </Box>
              </>
            )}

            <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
              <Button
                data-testid="add-project-cancel-button"
                variant="outlined"
                onClick={handleCancel}
              >
                {i18next.t('cancel')}
              </Button>
              <Button
                variant="contained"
                onClick={handleAddProject}
                disabled={!isSaveEnabled}
              >
                {i18next.t('save')}
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

const mapStateToProps = (state) => {
  return {
    constants: state.constants,
    attributes: state.attributes,
    account: state.account,
    clinkAccount: state.clinkAccount,
    ifsProjects: state.project?.ifsProjects,
  };
};

export default connect(mapStateToProps)(AddNewProjectV2);
