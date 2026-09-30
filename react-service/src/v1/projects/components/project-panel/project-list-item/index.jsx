import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { CONSTANTS } from 'clink-components';
import MuiDropdownButton from 'v2/apps/clink/pages/shared/MuiDropdown';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { modalAsyncAction } from 'v2/apps/clink/pages/orders/subcontractors/useActions/common';
import LazyImage from 'v1/global/components/LazyImage';
import Item from './Item';

const { eerieBlack, darkCharcoal } = CONSTANTS.colors.general;
const { proxima } = CONSTANTS.fonts;

const name = {
  fontFamily: `${proxima} !important`,
  fontWeight: 'bold',
  fontSize: '16px',
  color: eerieBlack,
  lineHeight: 1,
  textAlign: 'left',
  marginBottom: '4px',
  wordBreak: 'break-word',
};

const type = {
  fontFamily: `${proxima} !important`,
  fontSize: '14px',
  color: darkCharcoal,
  lineHeight: 1,
  opacity: 0.6,
  textAlign: 'left',
};

const ProjectListItem = ({
  image = '',
  projectName = '',
  projectType = '',
  href = '',
  setOpen = () => null,
  archived = false,
  handleArchive = () => null,
  handleRestore = () => null,
  project = {},
}) => {
  const [src, setSrc] = useState(image);
  const [classError, setClassError] = useState('project-image');

  const handleError = () => {
    setSrc(
      'https://clink-assets.s3.eu-west-2.amazonaws.com/production/static/images/project/project-building.svg',
    );
    setClassError('no-image-found');
  };

  const actions = archived
    ? [
        modalAsyncAction(
          setOpen,
          () => handleArchive(project).then(() => setOpen(false)),
          `Are you sure you want to archive ${projectName}?`,
          'Archive',
        ),
      ]
    : [
        modalAsyncAction(
          setOpen,
          () => handleRestore(project).then(() => setOpen(false)),
          `Are you sure you wish to Restore this project? `,
          'Restore',
        ),
      ];

  const link = archived ? href : '';

  return (
    <Item
      href={link}
      image={
        <LazyImage className={classError} src={src} onError={handleError} />
      }
      body={
        <>
          <Grid item>
            <Typography sx={name}>{projectName}</Typography>
          </Grid>
          <Grid item>
            <Typography sx={type}>{projectType}</Typography>
          </Grid>
        </>
      }
    >
      <Box position="absolute" top={10} right={10}>
        <MuiDropdownButton options={actions} />
      </Box>
    </Item>
  );
};

ProjectListItem.propTypes = {
  /** URL of the project image */
  image: PropTypes.string,
  /** Name of the project */
  projectName: PropTypes.string,
  /** Type/category of the project */
  projectType: PropTypes.string,
  /** URL for project navigation */
  href: PropTypes.string,
  /** Function to control modal open state */
  setOpen: PropTypes.func,
  /** Flag indicating if project is archived */
  archived: PropTypes.bool,
  /** Function to handle project archiving */
  handleArchive: PropTypes.func,
  /** Function to handle project restoration */
  handleRestore: PropTypes.func,
  /** Project object containing full project data */
  project: PropTypes.shape({
    // Add specific project properties as needed
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    // Add other project properties here
  }),
};

ProjectListItem.defaultProps = {
  image: '',
  projectName: '',
  projectType: '',
  href: '',
  setOpen: () => null,
  archived: false,
  handleArchive: () => null,
  handleRestore: () => null,
  project: {},
};

export default ProjectListItem;
