import React from 'react';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import CardMedia from '@mui/material/CardMedia';
import { makeStyles } from '@mui/styles';
import { CONSTANTS } from 'clink-components';

const { iconDownloadWhite } = CONSTANTS.s3;
const { white, clinkGreen, clinkRed } = CONSTANTS.colors.general;

const useStyles = makeStyles(() => ({
  root: {},
  buttonStyles: {
    cursor: 'pointer',
    backgroundColor: clinkGreen,
    color: white,
    display: 'flex',
    width: 'max-content',
    borderRadius: '4px',
    maxHeight: '30px',
    '&:hover': {
      backgroundColor: clinkRed,
      color: white,
    },
    fontSize: '16px',
    padding: '2px 6px 2px 6px',
  },
  downloadIcon: {
    width: '16px',
    height: '22px',
    backgroundSize: 'cover',
    marginRight: '5px',
  },
  textFragment: {
    fontWeight: 300,
    borderLeft: `1px solid ${white}`,
    paddingLeft: '4px',
    backgroundColor: 'transparent',
  },
}));

const DownloadButton = ({ children, downloadLink }) => {
  const classes = useStyles();

  return (
    <Link className={classes.buttonStyles} href={downloadLink} download>
      <CardMedia
        className={classes.downloadIcon}
        image={iconDownloadWhite}
        title="Paella dish"
      />

      <Box className={classes.textFragment}>{children}</Box>
    </Link>
  );
};

export default DownloadButton;
