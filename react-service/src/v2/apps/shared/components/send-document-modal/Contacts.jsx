import React, { useEffect } from 'react';
import { useContext } from 'hooks/context';
import i18next from 'v2/helpers/i18n';
import { connect } from 'react-redux';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid2';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Tooltip from '@mui/material/Tooltip';

const getStatusChip = (status) => {
  if (Number(status) === 2) {
    return <Chip label="Confirmed" color="success" size="small" />;
  }
  return (
    <Chip
      label="Pending Verification"
      color="warning"
      size="small"
      icon={
        <Tooltip title={i18next.t('pending-verification')}>
          <InfoOutlinedIcon fontSize="small" />
        </Tooltip>
      }
    />
  );
};

const isDisabled = (contact) => {
  return !contact.status || Number(contact.status) !== 2;
};
const Contacts = ({ subcontractor = {}, contacts, dispatch, isUnifiedPage = false }) => {
  const context = useContext('clink');
  const { actions } = context;

  const handleSelectContact = (e, contact) => {
    e.stopPropagation();
    e.preventDefault();
    if (isDisabled(contact)) return;
    dispatch(
      actions.selectContact({
        subId: subcontractor?.sub_id || subcontractor?.id,
        contactId: contact.id,
      }),
    );
  };

  useEffect(() => {
    const subId = subcontractor?.sub_id || subcontractor?.id;

    if (isUnifiedPage && subcontractor?.users && subId) {
      // For unified page, initialize contacts in Redux state with users data
      // Only initialize if not already in state
      if (!contacts?.[subId]) {
        const currentContacts = { ...contacts };
        currentContacts[subId] = subcontractor.users.map(user => ({
          ...user,
          selected: false, // Initialize with unselected state
        }));
        dispatch(actions.setContacts(currentContacts));
      }
    } else if (!isUnifiedPage && subcontractor?.sub_id && !contacts?.[subcontractor.sub_id]) {
      // For non-unified pages, fetch contacts via API only if not already loaded
      dispatch(actions.getContacts(subcontractor?.sub_id));
    }
  }, [actions, dispatch, subcontractor?.sub_id, subcontractor?.id, subcontractor?.users, isUnifiedPage, contacts]);

  // Always use contacts from Redux state (for both unified and non-unified pages)
  const subId = subcontractor?.sub_id || subcontractor?.id;
  const contactsList = contacts?.[subId] || [];

  return (
    <Accordion key={subcontractor.sub_id || subcontractor.id} defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600}>{subcontractor?.name}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography sx={{ mb: 1 }}>
          {i18next.t('select-contacts-receive-enquiry')}:
        </Typography>

        {contactsList.map((contact) => (
          <Grid
            key={contact.id}
            container
            alignItems="center"
            justifyContent="space-between"
            sx={{
              px: 1,
              py: 0.5,
              borderRadius: 1,
            }}
          >
            <FormControlLabel
              disabled={isDisabled(contact)}
              control={<Checkbox checked={contact.selected} />}
              label={
                <Box>
                  <Typography>
                    {contact.name ||
                      `${contact.firstname || ''} ${contact.lastname || ''}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {contact.email}
                  </Typography>
                </Box>
              }
              onClick={(e) => handleSelectContact(e, contact)}
            />
            {getStatusChip(contact.status)}
          </Grid>
        ))}
      </AccordionDetails>
    </Accordion>
  );
};

const mapStateToProps = (state) => ({
  contacts: state.supplyChain.contacts,
});

export default connect(mapStateToProps)(Contacts);
