import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { CONSTANTS } from 'clink-components';
import Cookies from 'js-cookie';
import { useTheme } from '@mui/material/styles';
import OpenModal from './open-modal';
import ProjectsList from './project-list';
import { filterPackages } from './project-list/helpers';

const { ruby, clinkRed } = CONSTANTS.colors.general;
const { proxima } = CONSTANTS.fonts;

const PackagesModal = ({ projects = [] }) => {
  const theme = useTheme();
  const filteredProjects = projects.filter((project) => {
    const filteredExpiredTenders = filterPackages(project.tender || []);
    return filteredExpiredTenders.length;
  });
  const packageManagementCheck = Cookies.get('packageManagementCheck');
  const open = !packageManagementCheck && Boolean(filteredProjects.length);

  const [openModal, setOpenModal] = useState(open);

  const handleClose = () => {
    setOpenModal(!openModal);
    Cookies.set('packageManagementCheck', '1');
  };
  const classes = {
    root: {},
    headTitle: {
      textAlign: 'center',
      fontFamily: proxima,
      fontSize: '22px',
      padding: '0 40px',
      marginTop: '16px',
      [theme.breakpoints.down('sm')]: {
        fontSize: '16px',
        padding: 0,
        marginRight: '40px',
        marginTop: '8px',
      },
    },
    titleSpan: {
      fontSize: '22px',
      fontFamily: proxima,
      color: clinkRed,
      [theme.breakpoints.down('sm')]: {
        fontSize: '16px',
      },
    },
    limitator: {
      width: '100%',
      maxWidth: '314px',
      border: `1px solid ${ruby}`,
      margin: '24px auto',
      [theme.breakpoints.down('sm')]: {
        maxWidth: 'calc(100% - 24px)',
        margin: '4px auto 16px',
      },
    },
  };

  return (
    <OpenModal open={openModal} handleClose={handleClose}>
      <Typography component="h1" sx={classes.headTitle}>
        You have{' '}
        <Typography component="span" sx={classes.titleSpan}>
          Projects
        </Typography>{' '}
        and{' '}
        <Typography component="span" sx={classes.titleSpan}>
          Packages
        </Typography>{' '}
        that have passed the decision date.
      </Typography>
      <Typography component="h1" sx={classes.headTitle}>
        Please select the appropriate option below.
      </Typography>
      <Box sx={classes.limitator} />
      <ProjectsList projects={projects} handleClose={handleClose} />
    </OpenModal>
  );
};

export default PackagesModal;
