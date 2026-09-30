import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import i18next from 'v2/helpers/i18n';
import { CONSTANTS } from 'clink-components';

const {
  ahBeige,
  ahBeigeBorder,
  ahGray,
  ahGrayBorder,
  ahLightBeige,
  ahMaroon,
  clinkGreen,
  white,
} = CONSTANTS.colors.general;

const SUPPORT_EMAIL = 'support@c-link.com';

const sectionStyle = {
  p: 2,
  backgroundColor: ahLightBeige,
  borderRadius: '6px',
};

const nextStepStyle = {
  fontWeight: 300,
  mt: 1.5,
  textTransform: 'uppercase',
  fontSize: '12px',
  color: ahGrayBorder,
};

const copyText = async (text) => {
  const content = String(text || '');

  if (!navigator.clipboard || !globalThis.isSecureContext) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Clipboard API failed', err);
    return false;
  }
};

const PreviewMessage = ({ children }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <Box sx={{ mt: 1 }}>
      <Link
        component="button"
        variant="body2"
        onClick={() => setExpanded(!expanded)}
        sx={{ fontSize: '12px', color: ahGray }}
      >
        {expanded ? (
          <ExpandLessIcon sx={{ fontSize: '16px' }} />
        ) : (
          <ExpandMoreIcon sx={{ fontSize: '16px' }} />
        )}{' '}
        {i18next.t('asite-guide-preview-message') || ''}
      </Link>

      <Collapse in={expanded} mountOnEnter>
        <Box
          sx={{
            mt: 1,
            p: 1.5,
            backgroundColor: white,
            border: `1px solid ${ahGrayBorder}`,
            borderRadius: '6px',
            whiteSpace: 'pre-wrap',
          }}
        >
          <Typography
            variant="body2"
            sx={{ fontSize: '12px', fontStyle: 'italic' }}
          >
            {children}
          </Typography>

          <Button
            size="small"
            startIcon={
              copied ? (
                <CheckIcon sx={{ fontSize: '14px' }} />
              ) : (
                <ContentCopyIcon sx={{ fontSize: '14px' }} />
              )
            }
            onClick={async () => {
              const text =
                typeof children === 'string'
                  ? children
                  : String(children || '');
              const copiedSuccessfully = await copyText(text);

              if (!copiedSuccessfully) return;

              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            sx={{
              mt: 1.5,
              textTransform: 'none',
              fontSize: '12px',
              color: ahGray,
              borderColor: ahGrayBorder,
              borderRadius: '6px',
              '&:hover': {
                borderColor: ahGray,
                backgroundColor: ahLightBeige,
              },
            }}
            variant="outlined"
          >
            {copied
              ? i18next.t('asite-guide-copied')
              : i18next.t('asite-guide-copy-message')}
          </Button>
        </Box>
      </Collapse>
    </Box>
  );
};

const AsiteGuideTrigger = ({
  onClick,
  linkTranslationKey = 'asite-guide-link',
}) => {
  return (
    <Link
      component="button"
      variant="body2"
      onClick={onClick}
      sx={{
        color: clinkGreen,
        fontSize: '16px',
        textDecoration: 'none',
      }}
    >
      <HelpOutlineIcon
        sx={{ fontSize: '18px', marginRight: '4px', marginTop: '-4px' }}
      />
      {i18next.t(linkTranslationKey)}
    </Link>
  );
};

const AsiteGuide = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '8px',
            backgroundColor: white,
            padding: '30px',
          },
        },
      }}
    >
      <Box
        sx={{
          borderRadius: '8px',
          backgroundColor: ahBeige,
          border: `1px solid ${ahBeigeBorder}`,
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            pr: 6,
          }}
        >
          <WarningAmberIcon sx={{ color: ahMaroon }} fontSize="small" />
          <Typography variant="body2">
            {i18next.t('asite-guide-title')}
          </Typography>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ position: 'absolute', top: 4, right: 4 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: 5, pb: 3 }}>
          {/* Situation 1: Some projects showing */}
          <Box sx={{ ...sectionStyle, mb: 2 }}>
            <Typography variant="body2" sx={{ color: ahMaroon, mb: 1 }}>
              {i18next.t('asite-guide-projects-showing')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {i18next.t('asite-guide-projects-desc')}
            </Typography>
            <Typography sx={nextStepStyle}>
              {i18next.t('asite-guide-next-step')}
            </Typography>
            <Typography variant="body2">
              {i18next.t('asite-guide-projects-next-step')}
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
              {i18next.t('asite-guide-projects-note')}
            </Typography>
            <PreviewMessage>
              {i18next.t('asite-guide-projects-preview')}
            </PreviewMessage>
          </Box>

          {/* Situation 2: No projects showing */}
          <Box sx={sectionStyle}>
            <Typography variant="body2" sx={{ color: ahMaroon, mb: 1 }}>
              {i18next.t('asite-guide-no-projects-showing')}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {i18next.t('asite-guide-no-projects-desc')}
            </Typography>
            <Typography sx={nextStepStyle}>
              {i18next.t('asite-guide-next-step')}
            </Typography>
            <Typography variant="body2">
              {i18next.t('asite-guide-no-projects-next-step')}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              C-Link Support: <strong>{SUPPORT_EMAIL}</strong>
            </Typography>
            <PreviewMessage>
              {i18next.t('asite-guide-no-projects-preview')}
            </PreviewMessage>
          </Box>
        </DialogContent>
      </Box>
    </Dialog>
  );
};

PreviewMessage.propTypes = {
  children: PropTypes.node.isRequired,
};

AsiteGuideTrigger.propTypes = {
  onClick: PropTypes.func.isRequired,
  linkTranslationKey: PropTypes.string,
};

AsiteGuide.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export { AsiteGuide, AsiteGuideTrigger };
