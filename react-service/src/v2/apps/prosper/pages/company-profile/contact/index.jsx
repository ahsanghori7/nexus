import React from 'react';
import Grid from '@mui/material/Grid';
import { CONSTANTS } from 'clink-components';
import About from 'v2/apps/prosper/shared/crm-components/About';
import Item from 'v2/apps/prosper/shared/crm-components/Item';

const {
  iconContractor,
  iconPurplePhone,
  iconPurpleMail,
  iconPurpleLocation,
  iconPurpleWebsite,
} = CONSTANTS.s3;

const { prosperGrayBorder2 } = CONSTANTS.colors.prosper;

const Contact = ({ data, website, idContact = 0, loading = false }) => {
  let contact = null;
  if (data && data.users) {
    [contact] = idContact
      ? data.users.filter((s) => Number(s.id) === Number(idContact))
      : data.users;
  }
  const firstname = (contact && contact.firstname) || null;
  const lastname = (contact && contact.lastname) || null;
  let displayName = (contact && contact.display_name) || null;
  if (!displayName) {
    displayName = firstname || lastname ? `${firstname} ${lastname}` : null;
  }
  const email = (contact && contact.email) || null;
  const jobTitle = (contact && contact.job_title) || null;
  const landline = (data && data.landline) || null;
  const address = (data && data.address) || null;

  return (
    <Grid
      container
      item
      xs={12}
      sm={6}
      md={5}
      p={{ xs: 0, sm: 3 }}
      pl={{ lg: 12 }}
      pt={{ xs: 3 }}
      sx={{
        borderLeft: { sm: `1px solid ${prosperGrayBorder2}`, xs: 'none' },
        borderTop: { xs: `1px solid ${prosperGrayBorder2}`, sm: 'none' },
      }}
    >
      <About
        title="contacts"
        fontTitleSx={{
          fontSize: { xs: '16px', md: '19px' },
          fontWeight: 'bold',
        }}
        descSx={{ display: 'none' }}
        src={iconContractor}
        displayName={displayName}
        jobTitle={jobTitle}
        loading={loading}
      />
      <Item
        icon={iconPurpleMail}
        type="profile-mail"
        value={email}
        loading={loading}
        mt={4}
      />
      <Item
        icon={iconPurplePhone}
        type="profile-landline-number"
        value={landline}
        loading={loading}
      />
      <Item
        icon={iconPurpleLocation}
        type="profile-address"
        value={address}
        loading={loading}
      />
      <Item
        icon={iconPurpleWebsite}
        type="profile-website"
        value={website}
        url
        loading={loading}
        mt={{ xs: 3, sm: 0 }}
        gridSx={{ display: { xs: 'none', sm: 'flex' } }}
      />
    </Grid>
  );
};

export default Contact;
