import React from 'react';
import Typography from '@mui/material/Typography';
import ListItem from '@mui/material/ListItem';
import List from '@mui/material/List';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import Chip from '@mui/material/Chip';
import i18next from 'v2/helpers/i18n';
import Radio from '@mui/material/Radio';
import EditIcon from '@mui/icons-material/Edit';

const getStatusChip = (status) => {
  if (Number(status) === 2) {
    return (
      <Chip
        sx={{ ml: 1.25 }}
        label="Confirmed"
        variant="outlined"
        color="success"
        size="small"
        icon={<CheckCircleOutlineIcon fontSize="small" />}
      />
    );
  }
  return (
    <Chip
      sx={{ ml: 1.25 }}
      label="Pending"
      variant="outlined"
      color="warning"
      size="small"
      icon={<AccessTimeIcon fontSize="small" />}
    />
  );
};

const ContactList = ({ contacts, onRemove, onSetDefault, onEdit }) => {
  if (!contacts.length) {
    return (
      <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        {i18next.t('empty-contact-list')}
      </Typography>
    );
  }

  return (
    <List>
      {contacts.map((contact) => {
        const accountOwner = contact.is_main_contact === '1';
        return (
          <ListItem
            key={contact.id}
            sx={{
              border: '1px solid #eee',
              borderRadius: 1,
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1,
            }}
          >
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 'medium',
                  display: 'flex',
                  alignItems: 'center',
                  mb: 0.5,
                }}
              >
                {contact?.displayName ||
                  `${contact?.firstname} ${contact?.lastname}`}
                {getStatusChip(contact.status)}
                {accountOwner && (
                  <Chip
                    sx={{ ml: 1.25 }}
                    label={i18next.t('main-contact')}
                    variant="outlined"
                    color="secondary"
                    size="small"
                    icon={<AccountCircleOutlinedIcon fontSize="small" />}
                  />
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {contact.email}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center">
              {/* TODO: Hide frontend part until backend it's developed */}
              {false && (
                <Tooltip title="Edit Contact">
                  <IconButton onClick={() => onEdit(contact)}>
                    <EditIcon color="primary" sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              )}
              {!accountOwner && (
                <Tooltip title="Set Default Contact">
                  <Radio
                    size="small"
                    onChange={() => onSetDefault(contact)}
                    inputProps={{ 'aria-label': 'Set as main contact' }}
                  />
                </Tooltip>
              )}
              {!accountOwner && (
                <Tooltip title="Remove Contact">
                  <IconButton onClick={() => onRemove(contact)} color="error">
                    <CloseIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </ListItem>
        );
      })}
    </List>
  );
};

export { ContactList };
