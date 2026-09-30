import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useContext } from 'hooks/context';
import { connect } from 'react-redux';
import { Box, Typography, Button, TextField, FormControl } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { MuiInputLabel } from '../FieldHolder';
import { ContactList } from './contacts.styled';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import StatusDialog from './contactsStatusDialog';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import i18next from 'v2/helpers/i18n';
import DefaultContactDialog from './defaultContactDialog';
import RemoveContactDialog from './removeContactDialog';

function SubcontractorContacts({
  companyName = '',
  mainData = {},
  subcontractorId,
  supplyChain,
  dispatch,
}) {
  const context = useContext('clink');
  const { actions } = context;

  const [tabIndex, setTabIndex] = useState(0);
  const [newContact, setNewContact] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
  });
  const [dialog, setDialog] = useState({
    open: false,
    type: '',
    message: '',
  });

  const [defaultDialogOpen, setDefaultDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedDefaultContact, setSelectedDefaultContact] = useState(null);
  const [selectedRemoveContact, setSelectedRemoveContact] = useState(null);
  const [editingContact, setEditingContact] = useState(null);

  const handleSetDefaultClick = (contact) => {
    setSelectedDefaultContact(contact);
    setDefaultDialogOpen(true);
  };

  const fetchContacts = useCallback(() => {
    if (subcontractorId) {
      dispatch(actions.getContacts(subcontractorId));
    }
  }, [actions, dispatch, subcontractorId]);

  const handleCancelDefaultContact = () => {
    setDefaultDialogOpen(false);
    setSelectedDefaultContact(null);
  };

  const handleConfirmDefaultContact = () => {
    if (!selectedDefaultContact) return;
    dispatch(
      actions.setMainContact(({
        data: { is_main_contact: true },
        params: {
          account_id: selectedDefaultContact.account_id,
          id: selectedDefaultContact.id
        }
      })),
    ).then(() => {
      dispatch(actions.getContacts(subcontractorId));
      setDialog({
        open: true,
        type: 'success',
        message: i18next.t('main-contact-set-success-msg'),
      });
    }).catch(() => {
      setDialog({
        open: true,
        type: 'error',
        message: i18next.t('main-contact-set-failed-msg'),
      });
    });
    handleCancelDefaultContact();
  };

  const handleRemoveContact = (contact) => {
    setSelectedRemoveContact(contact);
    setRemoveDialogOpen(true);
  };

  const handleCancelRemoveContact = () => {
    setRemoveDialogOpen(false);
    setSelectedRemoveContact(null);
  };

  const handleConfirmRemoveContact = () => {
    if (!selectedRemoveContact) return;
    dispatch(
      actions.removeContact({
        subcontractorId,
        userId: selectedRemoveContact?.id,
      }),
    ).then((response) => {
      const rejected = response?.type === 'account/removeContact/rejected';
      setDialog({
        open: true,
        type: rejected ? 'error' : 'success',
        message: rejected
          ? 'Failed to remove contact.'
          : 'Contact removed successfully!',
      });
    });
    handleCancelRemoveContact();
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setNewContact({
      firstname: contact.firstname,
      lastname: contact.lastname,
      email: contact.email,
      phone: contact.phone,
    });
    setTabIndex(2); // Switch to the "add/edit" tab
  };

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const validateName = (name, field) => {
    if (!name?.trim()) return `${field} is required`;
    if (name?.trim().length < 2)
      return `${field} must be at least 2 characters`;
    return '';
  };

  const validateEmail = (email) => {
    if (!email?.trim()) return 'Email is required';
    if (
      !/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
        email,
      )
    )
      return 'Enter a valid email';
    return '';
  };

  const validatePhone = (phone) => {
  if (!phone?.trim()) return 'Phone is required';

  const cleaned = phone.trim();
  if (!/^\+?\d{7,15}$/.test(cleaned)) {
    return 'Enter a valid phone number';
  }

  return '';
};

  const handleInputChange = (field, value) => {

    if (field === 'phone') {

    value = value.replace(/[^\d+]/g, '');

    if (value.includes('+')) {
      value = '+' + value.replace(/\+/g, '');
    }

    const digits = value.replace(/\D/g, '');
    if (digits.length > 15) {
      return;
    }
  }

    setNewContact({ ...newContact, [field]: value });

    let error = '';
    if (field === 'firstname') error = validateName(value, 'First name');
    if (field === 'lastname') error = validateName(value, 'Last name');
    if (field === 'email') error = validateEmail(value);
    if (field === 'phone') error = validatePhone(value);

    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const isFormValid = () => {
    return (
      !validateName(newContact.firstname, 'First name') &&
      !validateName(newContact.lastname, 'Last name') &&
      !validateEmail(newContact.email) &&
      !validatePhone(newContact.phone)
    );
  };

  const contactData = { ...newContact, ...mainData };
  const handleAddOrUpdateContact = () => {
    if (!isFormValid()) return;

    if (editingContact) {
      dispatch(
        actions.updateContact({
          subcontractorId,
          userId: editingContact.id,
          contact: contactData,
        }),
      )
        .then(() => {
          setEditingContact(null);
          setNewContact({ firstname: '', lastname: '', email: '', phone: '' });
          setErrors({ firstname: '', lastname: '', email: '', phone: '' });
          setTabIndex(0); // Go back to confirmed contacts
          setDialog({
            open: true,
            type: 'success',
            message: i18next.t('contact-update-success-msg'),
          });
        })
        .catch(() => {
          setDialog({
            open: true,
            type: 'error',
            message: i18next.t('contact-update-error-msg'),
          });
        });
    } else {
      dispatch(actions.addContact({ subcontractorId, contact: contactData }))
        .unwrap()
        .then(() => {
          setNewContact({ firstname: '', lastname: '', email: '', phone: '' });
          setErrors({ firstname: '', lastname: '', email: '', phone: '' });
          setTabIndex(1); // Switch to the pending tab
          setDialog({
            open: true,
            type: 'success',
            message: i18next.t('contact-success-msg'),
          });
        })
        .catch((error) => {
          const message = error?.response?.data?.message || error?.message;
          setDialog({
            open: true,
            type: 'error',
            message,
          });
        });
    }
  };

  const filteredContacts = useMemo(
    () =>
      (supplyChain?.contacts?.[subcontractorId] ?? []).filter((c) => {
        if (tabIndex === 0) {
          return Number(c.status) === 2;
        }
        if (tabIndex === 1) {
          return Number(c.status) !== 2;
        }
        return false;
      }),
    [subcontractorId, supplyChain?.contacts, tabIndex],
  );
  const confirmedCounts = useMemo(
    () =>
      (supplyChain?.contacts?.[subcontractorId] ?? []).filter(
        (c) => Number(c?.status) === 2,
      ).length,
    [subcontractorId, supplyChain?.contacts],
  );
  const pendingCounts = useMemo(
    () =>
      (supplyChain?.contacts?.[subcontractorId] ?? []).filter(
        (c) => Number(c?.status) !== 2,
      ).length,
    [subcontractorId, supplyChain?.contacts],
  );

  const closeDialog = () => setDialog({ ...dialog, open: false });

  return (
    <Box sx={{ width: '100%' }}>
      <Grid sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          {i18next.t('contacts')}
        </Typography>
        <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)}>
          <Tab
            label={
              <Box display="flex" alignItems="center">
                <span>{i18next.t('confirmed-contacts')} </span>
                <span className="items-count">{confirmedCounts}</span>
              </Box>
            }
          />
          <Tab
            label={
              <Box display="flex" alignItems="center">
                <span>{i18next.t('pending-contacts')} </span>
                <span className="items-count">{pendingCounts}</span>
              </Box>
            }
          />
          <Tab label={i18next.t('add-new-contact')} />
        </Tabs>
      </Grid>

      {tabIndex < 2 && (
        <ContactList
          contacts={filteredContacts}
          onRemove={handleRemoveContact}
          onSetDefault={handleSetDefaultClick}
          onEdit={handleEditContact}
        />
      )}

      {tabIndex === 2 && (
        <Box sx={{ mt: 5 }}>
          <Grid container spacing={2}>
            <>
              {['firstname', 'lastname', 'email', 'phone'].map((field) => {
                let labelText = '';
                if (field === 'firstname') {
                  labelText = 'First name';
                } else if (field === 'lastname') {
                  labelText = 'Last name';
                } else if (field === 'email') {
                  labelText = 'Email Address';
                } else if (field === 'phone') {
                  labelText = 'Phone number';
                }
                return (
                  <Grid key={field} size={12}>
                    <FormControl sx={{ ml: 1, mb: 3 }} fullWidth>
                      <MuiInputLabel>{labelText}</MuiInputLabel>
                      <TextField
                        variant="outlined"
                        fullWidth
                        name={field}
                        value={newContact[field]}
                        error={!!errors[field]}
                        helperText={errors[field]}
                        onKeyPress={(e) => {
                          // For phone field, allow digits and + (only when cursor at start, and no + yet)
                          if (field === 'phone') {
                            const isDigit = /[0-9]/.test(e.key);
                            const isPlus = e.key === '+';
                            const cursorAtStart = e.target.selectionStart === 0;
                            const alreadyHasPlus = e.target.value.startsWith('+');

                            if (!isDigit && !(isPlus && cursorAtStart && !alreadyHasPlus)) {
                              e.preventDefault();
                            }
                          }
                        }}
                        onChange={(e) =>
                          handleInputChange(field, e.target.value)
                        }
                      />
                    </FormControl>
                  </Grid>
                );
              })}
            </>
          </Grid>
          <Grid size={12}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleAddOrUpdateContact}
              disabled={!isFormValid()}
              startIcon={
                editingContact ? <EditOutlinedIcon /> : <AddCircleOutlineIcon />
              }
            >
              {editingContact
                ? i18next.t('update-contact')
                : i18next.t('add-contact')}
            </Button>
            {editingContact && (
              <Button
                fullWidth
                variant="text"
                color="secondary"
                sx={{ mt: 1 }}
                onClick={() => {
                  setEditingContact(null);
                  setNewContact({
                    firstname: '',
                    lastname: '',
                    email: '',
                    phone: '',
                  });
                  setTabIndex(0); // Go back to the contacts list
                }}
              >
                {i18next.t('cancel-edit')}
              </Button>
            )}
            <Typography
              variant="caption"
              display="block"
              sx={{ mt: 1, color: 'text.secondary', textAlign: 'center' }}
            >
              {editingContact
                ? i18next.t('update-contact-description')
                : i18next.t('add-contact-description')}
            </Typography>
          </Grid>
        </Box>
      )}

      <StatusDialog
        open={dialog.open}
        type={dialog.type}
        message={dialog.message}
        onClose={closeDialog}
      />
      <DefaultContactDialog
        open={defaultDialogOpen}
        onClose={handleCancelDefaultContact}
        onConfirm={handleConfirmDefaultContact}
        message={i18next.t('set-main-contact-msg')}
      />

      <RemoveContactDialog
        open={removeDialogOpen}
        onClose={handleCancelRemoveContact}
        onConfirm={handleConfirmRemoveContact}
        message={i18next.t('remove-contact-msg', {
          ContactName: selectedRemoveContact?.name,
          SubcontractorCompanyName: companyName,
        })}
      />
    </Box>
  );
}

const mapStateToProps = (state) => ({
  supplyChain: state.supplyChain,
});

export default connect(mapStateToProps)(SubcontractorContacts);
