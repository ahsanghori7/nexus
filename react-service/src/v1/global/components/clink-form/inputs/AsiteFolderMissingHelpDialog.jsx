import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import i18next from 'v2/helpers/i18n';

const copyPlainText = async (text) => {
  const content = String(text ?? '');
  if (
    !content ||
    !navigator.clipboard?.writeText ||
    !globalThis.isSecureContext
  ) {
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

const REASON_KEYS = [
  'asite-folder-missing-help-reason-1',
  'asite-folder-missing-help-reason-2',
  'asite-folder-missing-help-reason-3',
  'asite-folder-missing-help-reason-4',
];

const COPIED_RESET_MS = 2000;

const AsiteFolderMissingHelpDialog = ({ open, onClose }) => {
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef(null);

  const clearCopiedTimer = () => {
    if (copiedTimerRef.current) {
      clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (!open) {
      setCopied(false);
    }
    return clearCopiedTimer;
  }, [open]);

  const handleCopy = async () => {
    const text = i18next.t('asite-folder-missing-help-copy-message');
    const ok = await copyPlainText(text);
    if (!ok) return;
    setCopied(true);
    clearCopiedTimer();
    copiedTimerRef.current = setTimeout(() => {
      setCopied(false);
      copiedTimerRef.current = null;
    }, COPIED_RESET_MS);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableEnforceFocus
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          py: 2.5,
          px: 2.5,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography component="span" variant="h6" fontWeight={600}>
          {i18next.t('asite-folder-missing-help-title')}
        </Typography>
        <IconButton
          edge="end"
          color="inherit"
          onClick={onClose}
          aria-label={i18next.t('asite-folder-missing-help-close-aria')}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          px: 2.5,
          py: 2.5,
          maxHeight: '60vh',
          overflow: 'auto',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box>
            <Typography
              variant="subtitle2"
              fontWeight={600}
              color="text.primary"
              sx={{ mb: 1, mt: 2 }}
            >
              {i18next.t('asite-folder-missing-help-common-reasons-heading')}
            </Typography>
            <Box
              component="ul"
              sx={{
                m: 0,
                pl: 2.5,
                color: 'text.primary',
                listStyleType: 'disc',
                listStylePosition: 'outside',
              }}
            >
              {REASON_KEYS.map((key) => (
                <Box
                  key={key}
                  component="li"
                  sx={{
                    mb: 1,
                    '&:last-child': { mb: 0 },
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    component="span"
                    sx={{ pl: 0.5, lineHeight: 1.5 }}
                  >
                    {i18next.t(key)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box
            sx={{
              px: 1.5,
              py: 2,
              borderRadius: 1,
              bgcolor: 'action.hover',
            }}
          >
            <Typography
              variant="caption"
              fontWeight={600}
              color="text.secondary"
              display="block"
              sx={{ mb: 0.5 }}
            >
              {i18next.t('asite-folder-missing-help-expected-path-label')}
            </Typography>
            <Typography
              component="code"
              variant="body2"
              sx={{
                fontFamily: 'monospace',
                color: 'text.primary',
                wordBreak: 'break-word',
              }}
            >
              {i18next.t('asite-folder-missing-help-expected-path-value')}
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="subtitle2"
              fontWeight={600}
              color="text.primary"
              sx={{ mb: 0.5 }}
            >
              {i18next.t('asite-folder-missing-help-next-step-heading')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {i18next.t('asite-folder-missing-help-next-step-body')}
            </Typography>
          </Box>

          <Box
            sx={{
              borderRadius: 1,
              p: 2,
              bgcolor: 'grey.100',
            }}
          >
            <Typography
              variant="caption"
              fontWeight={600}
              color="text.secondary"
              display="block"
              sx={{ mb: 1.5 }}
            >
              {i18next.t('asite-folder-missing-help-copy-intro')}
            </Typography>
            <Box
              sx={{
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                p: 1.5,
                mb: 1.5,
                userSelect: 'text',
              }}
            >
              <Typography
                variant="body2"
                color="text.primary"
                component="div"
                sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}
              >
                {i18next.t('asite-folder-missing-help-copy-message')}
              </Typography>
            </Box>
            <Button
              fullWidth
              variant={copied ? 'outlined' : 'contained'}
              color={copied ? 'success' : 'primary'}
              startIcon={
                copied ? (
                  <CheckIcon sx={{ fontSize: 18 }} />
                ) : (
                  <ContentCopyIcon sx={{ fontSize: 18 }} />
                )
              }
              onClick={handleCopy}
              sx={{ textTransform: 'none', py: 1.25 }}
            >
              {copied
                ? i18next.t('asite-folder-missing-help-copied')
                : i18next.t('asite-guide-copy-message')}
            </Button>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.5,
          py: 2,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          justifyContent: 'flex-end',
        }}
      >
        <Button
          variant="outlined"
          color="primary"
          onClick={onClose}
          sx={{ textTransform: 'none' }}
        >
          {i18next.t('asite-folder-missing-help-go-back')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AsiteFolderMissingHelpDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AsiteFolderMissingHelpDialog;
