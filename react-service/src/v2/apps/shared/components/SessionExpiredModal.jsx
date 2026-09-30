import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { goTo } from 'v2/helpers/url';
import { SESSION_EXPIRED_EVENT, SESSION_EXPIRED_KEY } from 'v2/helpers/session';

const REDIRECT_DELAY_SECONDS = 5;

/**
 * Renders a centred, non-dismissible dialog when the application receives a
 * 401 Unauthorized response (session expired). A countdown automatically
 * redirects the user to the login page; the "Sign In" button triggers the same
 * redirect immediately.
 *
 * Mount once at the root of each app (clink, prosper, admin). The dialog is
 * driven by the SESSION_EXPIRED_EVENT custom DOM event dispatched from
 * handleUnauthorized() in v2/helpers/session.js.
 */
function SessionExpiredModal() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [countdown, setCountdown] = useState(REDIRECT_DELAY_SECONDS);

  const redirectToLogin = useCallback(() => {
    sessionStorage.removeItem(SESSION_EXPIRED_KEY);
    goTo('/login');
  }, []);

  useEffect(() => {
    const onSessionExpired = () => {
      setCountdown(REDIRECT_DELAY_SECONDS);
      setOpen(true);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    if (countdown <= 1) {
      const finalTimer = setTimeout(redirectToLogin, 1000);
      return () => clearTimeout(finalTimer);
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [open, countdown, redirectToLogin]);

  const secondsLabel = countdown === 1 ? `${countdown} second` : `${countdown} seconds`;

  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      disableEscapeKeyDown
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            px: 1,
            py: 1,
          },
        },
      }}
    >
      <DialogContent>
        <Typography variant="body1" sx={{ fontSize: '1rem', lineHeight: 1.7 }}>
          {t('session-expired-message')}
        </Typography>
        <Typography
          variant="body2"
          sx={{ mt: 1.5, color: 'text.secondary', fontSize: '0.85rem' }}
        >
          {t('session-expired-redirecting', { seconds: secondsLabel })}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ pr: 2, pb: 1.5 }}>
        <Button onClick={redirectToLogin} color="primary">
          {t('login-sign-in')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SessionExpiredModal;
