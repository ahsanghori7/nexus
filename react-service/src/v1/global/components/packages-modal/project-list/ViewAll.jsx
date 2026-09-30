import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import { CONSTANTS } from 'clink-components';

const { clinkRed, white } = CONSTANTS.colors.general;
const { caretDownWhite } = CONSTANTS.s3;

const ViewAll = ({
  pid = 0,
  show = false,
  packNumber = 0,
  handleShowAll = () => null,
}) => {
  const theme = useTheme();
  const [showAll, setShowAll] = useState(show);
  const classes = {
    root: {
      backgroundColor: clinkRed,
      borderRadius: '4px',
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      marginRight: '30px',
      height: '30px',
      [theme.breakpoints.down('sm')]: {
        height: '20px',
        marginRight: '12px',
      },
      '& .MuiButtonBase-root': {
        padding: '3px 10px',
        alignItems: 'start',
        [theme.breakpoints.down('sm')]: {
          marginTop: '-12px',
          minWidth: 'auto',
        },
      },
    },
    viewText: {
      color: white,
      fontSize: '16px',
      textTransform: 'initial',
      fontWeight: 600,
      [theme.breakpoints.down('sm')]: {
        fontSize: '12px',
      },
    },
    carretIcon: {
      width: '18px',
      height: 'auto',
      transform: 'rotate(180deg) translate(0px, 2px)',
      margin: '7px',
      [theme.breakpoints.down('sm')]: {
        width: '12px',
        margin: 0,
        marginTop: '4px',
      },
    },
  };

  useEffect(() => {
    setShowAll(show);
  }, [show]);

  const handleOnClick = () => {
    setShowAll(!showAll);
    handleShowAll(pid, !showAll);
  };

  return (
    <Box sx={classes.root}>
      <Button onClick={handleOnClick}>
        {!showAll ? (
          <Typography sx={classes.viewText}>
            View all packages ({packNumber})
          </Typography>
        ) : (
          <Avatar
            sx={classes.carretIcon}
            src={caretDownWhite}
            variant="square"
          />
        )}
      </Button>
    </Box>
  );
};

export default ViewAll;
