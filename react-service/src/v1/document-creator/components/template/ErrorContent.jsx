import React from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import { goTo } from 'v2/helpers/url';

const ErrorContent = ({ setOpen = () => null, slug, tid }) => {
  const goToPack = () => goTo(`/main-contractor/project/${slug}/boq/${tid}`);
  return (
    <Grid container>
      <Grid item>
        <Typography component="p">
          You have selected &quot;Subcontractor to complete BoQ item
          breakdown&quot; as the pricing format. However, no Bill of Quantities
          (BoQ) is attached to this tender document. Please attach a BoQ to
          proceed.
        </Typography>
        <Typography component="p" mt={1}>
          Options available to you:
        </Typography>
        <ul>
          <li style={{ textAlign: 'left' }}>
            [Publish a BoQ] to attach the required document.
          </li>
          <li style={{ textAlign: 'left' }}>
            [Select Different Pricing Format] to choose another option for
            subcontractor pricing.
          </li>
        </ul>
        <Typography component="p">
          Note: Attaching a BoQ ensures that subcontractors can accurately
          complete their pricing based on the detailed item breakdown provided.
        </Typography>
      </Grid>
      <Grid item container sx={{ marginTop: 2 }}>
        <Grid item xs={6}>
          <Button variant="contained" color="success" onClick={goToPack}>
            <Typography>Publish a BoQ</Typography>
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button variant="outlined" color="error" onClick={() => setOpen()}>
            <Typography>Select Different Pricing Format</Typography>
          </Button>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ErrorContent;
