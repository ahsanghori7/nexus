import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Download from '@mui/icons-material/Download';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import i18next from 'v2/helpers/i18n';
import { CONSTANTS } from 'clink-components';
import MuiDialog from 'v2/apps/shared/components/dialog';

const { iconCloseGray } = CONSTANTS.s3;
const { black, clinkLightPurple, gray2, white } = CONSTANTS.colors.general;

const MuiSectionTitle = ({ children, rightContent }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <Typography sx={{ fontSize: { xs: '24px', lg: '32px' } }}>
        {children}
      </Typography>
      {rightContent && <Box>{rightContent}</Box>}
    </Box>
  );
};

const MuiRegistrationNumber = ({
  children,
  text = i18next.t('prequalification-reg_number'),
}) => {
  return (
    <Box>
      <Typography sx={{ fontSize: '14px', color: gray2, pb: 2 }}>
        {text}:
        <Typography
          component="span"
          sx={{
            display: 'inline-block',
            color: black,
            fontSize: '14px',
            pl: '4px',
          }}
        >
          {children}
        </Typography>
      </Typography>
    </Box>
  );
};

const MuiPanel = ({ p = 4, children, sx = {} }) => {
  return (
    <Card
      id="mui-panel"
      sx={{
        p,
        boxShadow: 'none',
        border: `1px solid ${clinkLightPurple}`,
        borderRadius: '8px',
        ...sx,
      }}
    >
      {children}
    </Card>
  );
};

const MuiIconButton = ({ children, visible = true, urlConfig = {} }) => {
  return (
    visible && (
      <Button
        {...urlConfig}
        size='small'
        color="success"
        variant='contained'
        startIcon={<Download />}
      >
        {children}
      </Button>
    )
  );
};

const MuiTabTitle = ({ children, icon }) => {
  const theme = useTheme();
  const largeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  return (
    <Box>
      {largeScreen && children}
      {!largeScreen && (
        <>
          {icon && (
            <CardMedia
              sx={{
                width: '24px',
                height: '24px',
                m: 1,
                backgroundSize: 'contain',
              }}
              image={icon}
            />
          )}
          {!icon && children}
        </>
      )}
    </Box>
  );
};

// Exclusive small screen components below

const MuiAccordionTitle = ({ children }) => {
  return (
    <Typography sx={{ fontSize: '14px', color: gray2 }}>{children}</Typography>
  );
};

const MuiAccordionItem = ({
  children,
  expanded,
  title = 'title here',
  order,
  handleAccordionOnChange,
}) => {
  return (
    <Accordion
      expanded={expanded === `panel${order}`}
      onChange={handleAccordionOnChange(`panel${order}`)}
      sx={{
        mb: 2,
        border: `1px solid ${clinkLightPurple}`,
        boxShadow: 'none',
        borderRadius: '8px!important',
        '&:before': {
          display: 'none',
        },
        '& .MuiAccordionSummary-expandIconWrapper': {
          color: 'unset',
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`panel${order}bh-content`}
        id={`panel${order}bh-header`}
      >
        <MuiAccordionTitle>{title}</MuiAccordionTitle>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>{children}</AccordionDetails>
    </Accordion>
  );
};

const MuiModal = ({
  children,
  openModal,
  modalProps = { noHeader: true },
  externalSetOpen = [],
}) => {
  const [open, setOpen] = externalSetOpen.length
    ? externalSetOpen
    : // eslint-disable-next-line react-hooks/rules-of-hooks
      useState(false);
  return (
    <>
      <Box onClick={() => setOpen(true)}>{openModal}</Box>
      <MuiDialog
        open={open}
        enableFullScreen={false}
        handleClose={() => setOpen(false)}
        handleXClose={() => setOpen(false)}
        iconClose={iconCloseGray}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: '#83848780',
            },
          },
        }}
        {...modalProps}
      >
        {children}
      </MuiDialog>
    </>
  );
};

const MuiToggleButton = ({ handleClick, isCloseVisible }) => {
  return (
    <Button
      onClick={handleClick}
      sx={{
        minWidth: 'unset',
        height: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 0,
        backgroundColor: `${white}!important`,
        pl: '6px',
        mt: '5px',
        mb: '5px',
        borderLeft: `1px solid ${isCloseVisible ? black : 'transparent'}`,
        '& svg': {
          height: `${isCloseVisible ? '18px' : '20px'}`,
          color: `${isCloseVisible ? black : clinkLightPurple}`,
        },
      }}
    >
      {isCloseVisible ? <CloseIcon /> : <AddIcon />}
    </Button>
  );
};

const MuiAccreditationLabel = ({ children }) => {
  return (
    <Typography sx={{ fontSize: '14px', marginBottom: '4px' }}>
      {children}
    </Typography>
  );
};

export {
  MuiSectionTitle,
  MuiRegistrationNumber,
  MuiPanel,
  MuiIconButton,
  MuiTabTitle,
  MuiAccordionTitle,
  MuiAccordionItem,
  MuiModal,
  MuiToggleButton,
  MuiAccreditationLabel,
};
