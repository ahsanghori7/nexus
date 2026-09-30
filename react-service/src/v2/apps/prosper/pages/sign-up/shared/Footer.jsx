import React from 'react';
import { CONSTANTS } from 'clink-components';
import Typography from '@mui/material/Typography';
import { Link as ReactLink } from 'react-router-dom';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import MuiButton from '@mui/material/Button';

import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import FlashMessage from 'v2/apps/shared/components/Alert';

const { white } = CONSTANTS.colors.general;

const messages = {
  1: { severity: 'success', message: 'Email resent successfully' },
  2: { severity: 'warning', message: 'Email could not be resent' },
  3: {
    severity: 'error',
    message: 'There was an issue. Contact with C-Link support',
  },
};
const Footer = ({
  resend = false,
  useSubmitted = [],
  useLoading = [],
  linkList = [],
}) => {
  const [loading, setLoading] = useLoading;
  const [submitted, setSubmitted] = useSubmitted;
  return (
    <Grid sx={{ marginBottom: '80px' }}>
      {resend && (
        <Backdrop
          sx={{ color: white, zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loading}
          onClick={() => setLoading(false)}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      )}
      {resend && submitted && (
        <FlashMessage
          status={messages[submitted].severity}
          message={messages[submitted].message}
          open={Boolean(submitted)}
          handleClose={() => setSubmitted(false)}
        />
      )}
      {linkList.map((link, index) => (
        <Grid item mt={!index ? 7 : 1} ml={1} key={link.linkCopy}>
          {link.linkDesc && (
            <Typography variant="normal">{link.linkDesc}</Typography>
          )}
          {link.linkCopy === 'Resend' ? (
            <ReactLink {...link.props} style={{ textDecoration: 'none' }}>
              <MuiButton
                design="red"
                sx={{
                  display: 'block',
                  marginTop: '20px',
                }}
              >
                <Typography variant="normal">{link.linkCopy}</Typography>
              </MuiButton>
            </ReactLink>
          ) : (
            <ReactLink {...link.props}>
              <Link component="span">
                <Typography variant="normal">{link.linkCopy}</Typography>
              </Link>
            </ReactLink>
          )}
        </Grid>
      ))}
    </Grid>
  );
};

export default Footer;
