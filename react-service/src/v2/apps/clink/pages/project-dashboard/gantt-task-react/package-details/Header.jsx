import React from 'react';
import { CONSTANTS, Image } from 'clink-components';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import PackageInfo from './PackageInfo';
import PackageStatus from './PackageStatus';

const { iconEditTurqoise } = CONSTANTS.s3;

const Header = ({ tender, packStatus, theme, expanded, handleChange }) => {
  const { id, warning } = tender;
  const alignment = { display: 'flex', justifyContent: 'center' };
  const { palette } = theme;
  const { t } = useTranslation();
  return (
    <ListItemButton
      onClick={() => handleChange(id)}
      divider={!expanded.includes(id)}
      sx={{
        borderLeft: packStatus && `3px solid ${tender.color}`,
        minHeight: '79px',
        padding: '8px',
      }}
    >
      {expanded.includes(id) ? (
        <ExpandLess color="secondaryBlack" />
      ) : (
        <ExpandMore color="secondaryBlack" />
      )}
      <Grid container sx={{ alignItems: 'center', flexWrap: 'nowrap' }}>
        <Grid item xs={6}>
          <ListItemText
            primary={<Typography variant="title">{tender.name}</Typography>}
          />
        </Grid>
        <Grid item xs={2} sx={alignment}>
          {packStatus && <PackageInfo info={tender.interests} />}
        </Grid>
        <Grid item xs={2} sx={alignment}>
          {packStatus && (
            <PackageInfo
              info={tender.quotes.main}
              extra={tender.quotes.extra}
            />
          )}
        </Grid>
        {packStatus && (
          <Divider
            orientation="vertical"
            variant="middle"
            flexItem
            sx={{ m: 0 }}
          />
        )}
        <Grid
          item
          xs={2}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {packStatus ? (
            <PackageStatus
              status={packStatus}
              warning={warning}
              theme={theme}
            />
          ) : (
            <Box display="inline-flex" sx={{ alignItems: 'center' }}>
              <Typography
                variant="body2"
                color={palette.success.main}
                mt={0.5}
                mr={1}
              >
                {t('setup')}
              </Typography>
              <Image src={iconEditTurqoise} />
            </Box>
          )}
        </Grid>
      </Grid>
    </ListItemButton>
  );
};

export default Header;
