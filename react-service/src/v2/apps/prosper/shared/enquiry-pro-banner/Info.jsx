import React from 'react';
import { useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { CONSTANTS, Image } from 'clink-components';

const { prosperProBgGrayIcon } = CONSTANTS.colors.prosper;

const Info = ({ icon, title = '', description = '' }) => {
  const theme = useTheme();
  const classes = {
    box: {
      color: theme.palette.common.white,
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    icon: {
      width: '27px',
      height: '27px',
      display: 'block',
    },
  };
  return (
    <Grid container>
      <Grid item xs={2} p={1.25} pt={0.5}>
        <Avatar sx={{ backgroundColor: prosperProBgGrayIcon }}>
          <Image src={icon} sx={classes.icon} />
        </Avatar>
      </Grid>
      <Grid item xs={10}>
        <Box sx={classes.box}>
          <Typography sx={{ fontSize: '17px', fontWeight: 'bold' }}>
            {title}
          </Typography>
          <Typography sx={{ fontSize: '12px', fontWeight: '100' }}>
            {description}
          </Typography>
        </Box>
      </Grid>
    </Grid>
  );
};

export default Info;
