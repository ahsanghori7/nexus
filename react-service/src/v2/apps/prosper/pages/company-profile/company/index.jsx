import React from 'react';
import Grid from '@mui/material/Grid';
import { CONSTANTS } from 'clink-components';
import Contact from './Contact';
import Item from 'v2/apps/prosper/shared/crm-components/Item';
import Description from 'v2/apps/prosper/shared/crm-components/Description';

const { iconPurpleWebsite } = CONSTANTS.s3;

const DescWrapper = ({ loading, website, description, gridSx = {} }) => (
  <>
    <Description
      gridSx={gridSx}
      text={description}
      fontSx={{ xs: '16px', sm: '19px' }}
      descFontSx={{ xs: '14px', sm: '16px' }}
      loading={loading}
    />
    {Boolean(website) && (
      <Item
        icon={iconPurpleWebsite}
        type="profile-website"
        value={website}
        url
        loading={loading}
        gridSx={gridSx}
      />
    )}
  </>
);

const Company = ({
  src,
  companyName,
  description,
  website,
  loading = false,
}) => {
  return (
    <Grid container item xs={12} sm={6} md={7} p={{ xs: 0, md: 3 }}>
      <Contact src={src} companyName={companyName} pt={{ xs: 1, sm: 4 }}>
        <DescWrapper
          loading={loading}
          description={description}
          gridSx={{ display: { xs: 'none', sm: 'flex' } }}
        />
      </Contact>
      <Grid container item sx={{ display: { xs: 'flex', sm: 'none' } }}>
        <DescWrapper
          loading={loading}
          website={website}
          description={description}
        />
      </Grid>
    </Grid>
  );
};

export default Company;
