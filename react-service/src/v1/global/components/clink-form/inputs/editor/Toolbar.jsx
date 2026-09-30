import React from 'react';
import Grid from '@mui/material/Grid2';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import AttachFileIcon from '@mui/icons-material/AttachFile';

const size = { width: '32px !important', height: '32px !important' };

const Toolbar = ({
  message,
  loadingSendMessage,
  sendCallback,
  attachment = true,
  bold = true,
  italic = true,
  underline = true,
  ordered = true,
  bullet = true,
}) => (
  <Grid id="toolbar" data-testid="toolbar" container border="none !important">
    {attachment && (
      <Grid>
        <IconButton variant="success" sx={size} className="ql-attachment" data-testid="ql-attachment">
          <AttachFileIcon />
        </IconButton>{' '}
      </Grid>
    )}
    {bold && (
      <Grid>
        <IconButton variant="success" sx={size} className="ql-bold" data-testid="ql-bold"  />
      </Grid>
    )}
    {italic && (
      <Grid>
        <IconButton variant="success" sx={size} className="ql-italic" data-testid="ql-italic"  />
      </Grid>
    )}
    {underline && (
      <Grid>
        <IconButton variant="success" sx={size} className="ql-underline" data-testid="ql-underline"  />
      </Grid>
    )}
    {ordered && (
      <Grid>
        <IconButton
          variant="success"
          sx={size}
          className="ql-list"
          value="ordered"
          data-testid="ql-ordered"
        />
      </Grid>
    )}
    {bullet && (
      <Grid>
        <IconButton
          variant="success"
          sx={size}
          className="ql-list"
          value="bullet"
          data-testid="ql-bullet"
        />
      </Grid>
    )}
    {sendCallback && (
      <Grid>
        <Button
          disabled={message?.trim() === ''}
          variant="success"
          className="ql-send"
          data-testid="ql-send"
        >
          {loadingSendMessage && <CircularProgress />}
          Send
        </Button>
      </Grid>
    )}
  </Grid>
);

export default Toolbar;
