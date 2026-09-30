import React, { useState, useMemo, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import Grid2 from '@mui/material/Grid2';
import Alert from '@mui/material/Alert';
import i18next from 'v2/helpers/i18n';
import { CONSTANTS } from 'clink-components';
import { TextField, Autocomplete } from '@mui/material';
import Button from '@mui/material/Button';
import Add from '@mui/icons-material/Add';
import Typography from '@mui/material/Typography';
import MembersList from './MembersList';
import { useContext } from 'hooks/context';
import InputAdornment from '@mui/material/InputAdornment';
import Search from '@mui/icons-material/Search';

const { lightPeriwinkle } = CONSTANTS.colors.general;

const MembersSection = ({ constants, project, dispatch }) => {
  let semaphore = useRef(true);
  const members = project?.members || [];
  const [newMember, setNewMember] = useState({
    id: null,
    team_id: null,
    position: '',
    firstname: '',
    lastname: '',
    contact_number: '',
    email: '',
  });
  const [errors, setErrors] = useState({});
  const [mainError, setMainError] = useState('');
  const [selectedFromTeam, setSelectedFromTeam] = useState({});
  const [teamDialog, setTeamDialog] = useState(false);

  const context = useContext('clink');
  const { actions } = context;

  useEffect(() => {
    if (semaphore && Boolean(project?.data?.id)) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      semaphore = false;
      dispatch(actions.fetchTeamApi(project?.data?.id || 0));
    }
  }, [project?.data?.id]);

  const handleChange = (e) => {
    let toChange = { ...newMember, [e.target.name]: e.target.value };
    if (e.target.name === 'email' && !e.target.value) {
      toChange = {
        ...newMember,
        [e.target.name]: e.target.value,
        id: null,
        team_id: null,
      };
    }
    setNewMember(toChange);
    setErrors({ ...errors, [e.target.name]: '' });
    setMainError('');
  };

  const handlePostMember = async (data) => {
    const result = await dispatch(
      actions.postMember({ pid: project?.data?.id, ...data }),
    );
    if (result?.error) {
      setMainError(result?.payload?.message || 'Error updating Team Details');
      return result;
    }
    setMainError('');
    dispatch(actions.fetchTeam());
    return result;
  };

  const handleAddMember = async () => {
    if (
      members.some(
        (m) =>
          m.firstname === newMember.firstname && m.email === newMember.email,
      )
    ) {
      setErrors({ email: 'This member is already added.' });
      return;
    }

    const result = await handlePostMember(newMember);
    if (result?.error) {
      return;
    }
    setNewMember({
      position: '',
      firstname: '',
      lastname: '',
      contact_number: '',
      email: '',
      id: null,
      team_id: null,
    });
  };

  const handleDeleteMember = async (teamId, userId) => {
    const result = await dispatch(
      actions.deleteMember({ pid: project?.data?.id, teamId, userId }),
    );
    if (result?.error) {
      setMainError(result?.payload?.message || 'Error deleting Team Member');
      return null;
    }
    setMainError('');
    return result;
  };

  const handleOpenTeamDialog = () => setTeamDialog(true);
  const handleCloseTeamDialog = () => setTeamDialog(false);

  const handleAddSelectedMembers = () => {
    setNewMember({
      position: selectedFromTeam?.position ?? '',
      firstname: selectedFromTeam?.firstname ?? '',
      lastname: selectedFromTeam?.lastname ?? '',
      contact_number: selectedFromTeam?.contact_number ?? '',
      email: selectedFromTeam?.email ?? '',
      team_id: selectedFromTeam?.id ?? '',
      id: selectedFromTeam?.user_id ?? '',
    });
    setSelectedFromTeam({});
    handleCloseTeamDialog();
  };

  const teamRoleArray = useMemo(() => {
    const roles = constants?.project?.team_role || [];
    return [...roles].sort((a, b) => a?.label?.localeCompare(b?.label));
  }, [constants?.project?.team_role]);

  return (
    <Grid2
      size={{ xs: 12, md: 4 }}
      sx={{ width: '100% !important' }}
      container
      flexDirection="column"
    >
      <Grid2 borderBottom={`1px solid ${lightPeriwinkle}`} p={1.75}>
        <Typography sx={{ fontWeight: 600 }}>
          {i18next.t('your-project-team-details')}
        </Typography>
      </Grid2>
      {mainError && (
        <Grid2 sx={{ m: 1.75 }}>
          <Alert severity="error">{mainError}</Alert>
        </Grid2>
      )}
      <MembersList
        members={members}
        handleDeleteMember={handleDeleteMember}
        handleAddSelectedMembers={handleAddSelectedMembers}
        handlePostMember={handlePostMember}
        useTeamDialog={[teamDialog, setTeamDialog]}
        useSelectedFromTeam={[selectedFromTeam, setSelectedFromTeam]}
        handleCloseTeamDialog={handleCloseTeamDialog}
        teamRoleArray={teamRoleArray}
      />
      <Grid2 p={1.75} container spacing={2} flexDirection="column">
        <Grid2 container spacing={2}>
          <Grid2 size={12}>
            <Typography sx={{ fontSize: 11 }}>
              {newMember?.team_id || newMember?.id
                ? i18next.t('pre-filled-from-team')
                : null}
            </Typography>
          </Grid2>
          <Grid2 mb={1} sx={{ overflow: 'visible' }}>
            <Autocomplete
              data-testid="member-selection-position-autocomplete"
              options={teamRoleArray}
              getOptionLabel={(option) => option.label}
              value={
                teamRoleArray.find((item) => item.id === newMember?.position) ||
                null
              }
              onChange={(event, option) => {
                handleChange({
                  target: { name: 'position', value: option?.id ?? '' },
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Position"
                  name="position"
                  slotProps={{
                    htmlInput: {
                      ...params.inputProps,
                      'data-testid':
                        'member-selection-position-autocomplete-input',
                    },
                  }}
                  required
                  error={!!errors.position}
                  helperText={errors.position || ''}
                  fullWidth
                  sx={{
                    width: 200,
                    '& .MuiInputBase-input': {
                      paddingLeft: '0 !important',
                    },
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start" sx={{ pl: 1 }}>
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              PopperProps={{
                modifiers: [
                  {
                    name: 'zIndex',
                    enabled: true,
                    phase: 'write',
                    fn: ({ state }) => {
                      state.elements.popper.style.zIndex = '1300';
                    },
                  },
                ],
              }}
            />
          </Grid2>
          <Grid2 mb={1}>
            <TextField
              slotProps={{
                htmlInput: {
                  'data-testid': 'member-selection-firstname-input',
                },
              }}
              label="Firstname"
              name="firstname"
              value={newMember?.firstname}
              onChange={handleChange}
              helperText={errors.firstname || ''}
            />
          </Grid2>
          <Grid2 mb={1}>
            {' '}
            <TextField
              slotProps={{
                htmlInput: { 'data-testid': 'member-selection-lastname-input' },
              }}
              label="Lastname"
              name="lastname"
              value={newMember?.lastname}
              onChange={handleChange}
              helperText={errors.lastname || ''}
            />
          </Grid2>
          <Grid2 mb={1}>
            {' '}
            <TextField
              slotProps={{
                htmlInput: {
                  'data-testid': 'member-selection-phone-number-input',
                },
              }}
              label="Phone number"
              name="contact_number"
              value={newMember?.contact_number}
              onChange={handleChange}
              helperText={errors.contact_number || ''}
            />
          </Grid2>
          <Grid2 mb={1}>
            {' '}
            <TextField
              slotProps={{
                htmlInput: { 'data-testid': 'member-selection-email-input' },
              }}
              label="Email"
              name="email"
              value={newMember?.email}
              onChange={handleChange}
              helperText={errors.email || ''}
            />
          </Grid2>
        </Grid2>
        <Grid2 mb={1} container justifyContent="flex-end">
          {/* sx: Hack to make contained icon button. To investigate proper way to do it  */}
          <Button
            data-testid="member-selection-add-member-button"
            variant="contained"
            color="primary"
            onClick={handleAddMember}
          >
            <Add /> Add Team Member
          </Button>
        </Grid2>
      </Grid2>
      <Grid2 p={1.75} container spacing={2}>
        <Button
          data-testid="member-selection-select-from-team-button"
          variant="outlined"
          color="secondary"
          onClick={handleOpenTeamDialog}
          style={{ marginTop: '10px' }}
        >
          {i18next.t('select-from-team')}
        </Button>
      </Grid2>
    </Grid2>
  );
};

const mapStateToProps = (state) => {
  return {
    constants: state.constants,
    project: state.project,
  };
};

export default connect(mapStateToProps)(MembersSection);
