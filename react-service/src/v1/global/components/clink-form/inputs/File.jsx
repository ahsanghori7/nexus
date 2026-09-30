import React, { useRef, useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import CircularProgress from '@mui/material/CircularProgress';
import FieldHolder from '../FieldHolder';
import FieldLabel from '../FieldLabel';

const File = ({
  label = '',
  value,
  callback,
  handleRemove,
  handleUpdate,
  handleClick,
  testId = undefined,
}) => {
  const fileInputRef = useRef(null);

  const [id, setId] = useState(value?.id || 0);
  const [name, setName] = useState(value?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    setId(value?.id);
    setName(value?.name);
  }, [value]);

  const runWithStatus = async (action, fallbackErrorText) => {
    setIsLoading(true);
    setErrorText('');

    try {
      const result = await action();

      if (!result) {
        throw new Error('Unexpected response from server.');
      }

      setIsLoading(false);
      return true;
    } catch (error) {
      setIsLoading(false);
      setErrorText(error?.message || fallbackErrorText);
      return false;
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (file.type !== 'application/pdf') {
      setErrorText('Only PDF files are allowed.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (id) {
      await runWithStatus(
        () => handleUpdate(id, { file }),
        'Unable to update file.',
      );
    } else {
      await runWithStatus(() => callback({ file }), 'Unable to upload file.');
    }
  };

  const handleDelete = async () => {
    if (handleClick) {
      handleClick();
    }
    const removed = await runWithStatus(
      () => handleRemove(id),
      'Unable to remove file.',
    );

    if (removed && fileInputRef.current) {
      fileInputRef.current.value = '';
      setName('');
      setId(0);
    }
  };

  const buttonClickHandler = () => {
    if (handleClick) {
      handleClick();
    }
    fileInputRef.current.click();
  };
  return (
    <FieldHolder data-testid={testId}>
      <FieldLabel>{label}</FieldLabel>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Button
        variant="contained"
        onClick={buttonClickHandler}
        disabled={isLoading}
      >
        Upload PDF file
      </Button>
      {isLoading && <CircularProgress size={20} sx={{ ml: 2 }} />}
      {Boolean(errorText) && (
        <Alert sx={{ mt: 1 }} severity="error">
          {errorText}
        </Alert>
      )}
      {Boolean(id) && (
        <List sx={{ mt: 2 }}>
          <ListItem disableGutters>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ListItemText primary={name} />
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={handleDelete}
                disabled={isLoading}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </ListItem>
        </List>
      )}
    </FieldHolder>
  );
};

export default File;
