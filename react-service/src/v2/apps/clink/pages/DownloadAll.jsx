import React, { useState, useCallback, useMemo } from 'react';
import { goTo, getQueryStringVars } from 'v2/helpers/url';
import { CONSTANTS, Image } from 'clink-components';
import { ThemeProvider } from '@mui/material';
import useMuiTheme from 'v2/apps/shared/components/muiTheme';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { PHPAppClinkGloblals } from 'v2/helpers/php-globals';

const { clinkLogo, prosperLogoFull } = CONSTANTS.s3;

const DownloadAll = () => {
  const [email, setEmail] = useState('');
  const params = getQueryStringVars();
  const theme = useMuiTheme('clink');

  const sxClink = { '& img': { height: 'auto', width: '100px' } };
  const sxProsper = {
    '& img': { height: 'auto', width: '120px', marginTop: '12px' },
  };

  const conf = PHPAppClinkGloblals();
  let csfr = 'some-csfr';
  let error_message = false;
  if (conf && conf.csrfToken) {
    csfr = conf.csrfToken;
    error_message = conf.error_message;
  }

  const title = useMemo(() => {
    if (params?.email) {
      return "Thank you! We'll notify you as soon as your download is ready";
    }
    return 'We are preparing your files for download';
  }, [params?.email]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      if (!csfr) {
        // eslint-disable-next-line no-console
        console.error('CSRF token is not available');
        return;
      }
      goTo(`${window.location.href}&email=${encodeURIComponent(email)}`);
    },
    [email, csfr],
  );
  return (
    <ThemeProvider theme={theme}>
      <Grid
        container
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
      >
        <Grid item textAlign="center">
          <Paper elevation={3} style={{ padding: '20px' }}>
            <Container>
              <Grid container spacing={2} justifyContent="center" mb={2}>
                <Grid item sx={sxClink} p={0}>
                  <Image src={clinkLogo} />
                </Grid>
                <Grid item sx={sxProsper} p={0}>
                  <Image src={prosperLogoFull} />
                </Grid>
              </Grid>
              {error_message && (
                <Typography variant="body1" color="error" gutterBottom>
                  {error_message}
                </Typography>
              )}
              <Typography variant="h4" gutterBottom>
                {title}
              </Typography>
              {(!params?.email || error_message) && (
                <>
                  <Typography variant="body1" mt={2} gutterBottom>
                    Please provide your email address to receive a notification when your download is ready..
                  </Typography>
                  <form onSubmit={handleSubmit}>
                    <Grid
                      container
                      spacing={2}
                      direction="column"
                      alignItems="center"
                    >
                      <Grid
                        item
                        xs={12}
                        sm={8}
                        md={6}
                        style={{ width: '100%' }}
                      >
                        <TextField
                          label="Email"
                          type="email"
                          variant="outlined"
                          fullWidth
                          required
                          onChange={(e) => setEmail(e.target.value)}
                          value={email}
                        />
                      </Grid>
                      <Grid item>
                        <Button
                          variant="contained"
                          color="primary"
                          type="submit"
                        >
                          Submit
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                </>
              )}
            </Container>
          </Paper>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
};

export default DownloadAll;
