import React, { useState } from 'react';
import MuiButton from '@mui/material/Button';
import Grid2 from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import PropTypes from 'prop-types';

const Content = ({ setShow, addTemplate, loading, setError, templates }) => {
  const [text, setText] = useState('');
  const [existingPackage, showExistingPackage] = useState(false);

  const handleSetText = (event) => {
    setError(false);
    setText(event.target.value);
  };

  const handleOnClick = () => {
    if (templates && templates.filter((t) => t.name === text).length) {
      showExistingPackage(true);
    } else {
      addTemplate(text);
      showExistingPackage(false);
      setShow(false);
    }
  };

  const handleOnClose = () => {
    setShow(false);
  };

  return (
    <Grid2 container justifyContent="flex-end">
      <Grid2 size={12} pb={2} pt={2}>
        <TextField
          required
          type="text"
          name="category-name"
          value={text}
          label="Name this package"
          placeholder="Enter name of package"
          error={existingPackage}
          onChange={handleSetText}
          onBlur={handleSetText}
          helperText={
            existingPackage ? 'A tender with this name already exists' : ''
          }
        />
      </Grid2>
      <Grid2 size={12} textAlign="right">
        <MuiButton
          sx={{ mr: 2 }}
          variant="contained"
          color="success"
          onClick={handleOnClick}
          disabled={!text || loading}
        >
          Create
        </MuiButton>
        <MuiButton
          variant="outlined"
          disabled={loading}
          onClick={handleOnClose}
          color="error"
        >
          {' '}
          Go back
        </MuiButton>
      </Grid2>
    </Grid2>
  );
};

Content.propTypes = {
  setShow: PropTypes.func.isRequired,
  addTemplate: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  setError: PropTypes.func.isRequired,
  templates: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      // Add other properties of template objects here if known
    })
  ),
};

Content.defaultProps = {
  loading: false,
  templates: [],
};

export default Content;
