import React, { useEffect, useMemo } from 'react';
import i18next from 'v2/helpers/i18n';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import Grid2 from '@mui/material/Grid2';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Delete from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import { CONSTANTS } from 'clink-components';

const { clinkPurple, clinkGreen } = CONSTANTS.colors.general;

const MembersList = ({
  handleDeleteMember = () => null,
  handleAddSelectedMembers = () => null,
  handleCloseTeamDialog = () => null,
  handlePostMember = () => null,
  members = [],
  useTeamDialog,
  useSelectedFromTeam,
  account,
  dispatch,
  teamRoleArray = [],
}) => {
  const [teamDialog] = useTeamDialog;
  const [selectedFromTeam, setSelectedFromTeam] = useSelectedFromTeam;
  const context = useContext('clink');
  const { actions } = context;

  useEffect(() => {
    if (!account?.team?.members?.length) {
      dispatch(actions.fetchTeam());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const teamToAddListFiltered = useMemo(() => {
    return (
      (account?.team?.members?.length && account.team.members) ||
      []
    ).filter((member) => !members.some((m) => m.member.email === member.email));
  }, [members, account?.team?.members]);
  return (
    <>
      {Boolean(members?.length) && (
        <Grid2
          sx={{
            width: '100%',
            overflowX: 'scroll',
          }}
          p={1.75}
          container
          spacing={2}
        >
          <TableContainer
            component={Paper}
            sx={{
              '&::-webkit-scrollbar': {
                width: '10px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: clinkPurple,
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: clinkGreen,
              },
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{i18next.t('position')}</TableCell>
                  <TableCell>{i18next.t('profile-firstname')}</TableCell>
                  <TableCell>{i18next.t('profile-lastname')}</TableCell>
                  <TableCell>{i18next.t('contact')}</TableCell>
                  <TableCell>{i18next.t('email')}</TableCell>
                  <TableCell>{i18next.t('table-column-actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <TextField
                        sx={{ maxWidth: '227px', width: '100%' }}
                        name="position"
                        fullWidth
                        required
                        select
                        value={m?.member?.position?.id}
                        onChange={(e) =>
                          handlePostMember({
                            position: e.target.value,
                            id: m?.user_id,
                            firstname: m?.member?.firstname,
                            lastname: m?.member?.lastname,
                            contact_number: m?.member?.contact_number,
                            email: m?.member?.email,
                          })
                        }
                      >
                        {teamRoleArray.map((option) => (
                          <MenuItem key={option.id} value={option.id}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                    <TableCell>{m?.member?.firstname}</TableCell>
                    <TableCell>{m?.member?.lastname}</TableCell>
                    <TableCell>
                      <TextField
                        name="contact_number"
                        required
                        value={m?.member?.contact_number}
                        onChange={(e) =>
                          dispatch(
                            actions.updateMember({
                              id: m?.user_id,
                              name: 'contact_number',
                              value: e.target.value,
                            }),
                          )
                        }
                        onBlur={(e) =>
                          handlePostMember({
                            position: m?.member?.position?.id,
                            firstname: m?.member?.firstname,
                            lastname: m?.member?.lastname,
                            contact_number: e.target.value,
                            email: m?.member?.email,
                            id: m?.user_id,
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>{m?.member?.email}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleDeleteMember(m.id, m.user_id)}
                        color="secondary"
                      >
                        <Delete />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid2>
      )}
      <Dialog open={teamDialog} onClose={handleCloseTeamDialog}>
        <DialogTitle>{i18next.t('select-from-team')}</DialogTitle>
        <DialogContent>
          <FormControl>
            <RadioGroup>
              {teamToAddListFiltered.map((member) => {
                const checked =
                  String(selectedFromTeam.user_id) === String(member.user_id);
                return (
                  <FormControlLabel
                    key={member.user_id}
                    onClick={() => setSelectedFromTeam(member)}
                    value={checked}
                    control={<Radio checked={checked} />}
                    label={`${member.firstname} ${member.lastname} (${member.email})`}
                  />
                );
              })}
            </RadioGroup>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseTeamDialog}
            color="secondary"
            variant="contained"
          >
            {i18next.t('cancel')}
          </Button>
          <Button
            onClick={handleAddSelectedMembers}
            color="primary"
            variant="contained"
          >
            {i18next.t('add-selected')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const mapStateToProps = (state) => {
  return {
    account: state.account,
  };
};

export default connect(mapStateToProps)(MembersList);
