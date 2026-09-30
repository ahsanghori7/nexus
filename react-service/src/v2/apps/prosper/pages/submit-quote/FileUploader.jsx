import React, { useRef } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { sizeFileIsCorrect } from 'v2/helpers/files';
import i18next from 'v2/helpers/i18n';
import { FileUploaderTitle, FileUploaderLabel } from './mui.styled';
import { CONSTANTS } from 'clink-components';

const { white } = CONSTANTS.colors.general;
const { SilverSand, prosperRedBorder, prosperBoxGreen } =
  CONSTANTS.colors.prosper;

const FileUploader = ({
  files = [],
  setFiles,
  setHasFiles,
  readOnly = false,
  deletedFiles,
  setDeletedFiles,
}) => {
  const fileInputRef = useRef(null);
  const handleAddFile = (event) => {
    if (!readOnly) {
      const newFiles = Array.from(event.target.files).map((file) => ({
        file,
        id: `${file.name}-${Date.now()}`,
        error: !sizeFileIsCorrect(file) ? 'File too large' : '',
      }));
      setFiles((prevFiles) => [...newFiles, ...prevFiles]);
      setHasFiles(true);
    }
  };

  const handleRemoveFile = (id) => {
    if (!readOnly) {
      setFiles((prevFiles) => prevFiles.filter((fileObj) => fileObj.id !== id));
      setDeletedFiles([...deletedFiles, id]);
      setHasFiles(true);
      // Reset input field to allow re-adding the same file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Box sx={{ p: '60px 0' }}>
      <FileUploaderTitle>{i18next.t('documents')}</FileUploaderTitle>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Stack
          sx={{ width: '100%' }}
          direction="row"
          flexWrap="wrap"
          spacing={files.length ? 1 : 0}
        >
          {files.map((fileObj) => (
            <Box
              key={fileObj.id}
              sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                margin: '0!important',
                width: '33.33%',
                padding: '0 16px 16px 0',
                boxSizing: 'border-box',
                '&:nth-of-type(3n)': {
                  paddingRight: 0,
                },
              }}
            >
              <Chip
                sx={{
                  borderRadius: '4px',
                  backgroundColor: white,
                  border: `1px solid ${SilverSand}`,
                  fontSize: '16px',
                  height: '44px',
                  display: 'flex',
                  width: '100%',
                  justifyContent: 'space-between',
                }}
                label={
                  <FileUploaderLabel>
                    {' '}
                    {fileObj.file ? fileObj.file.name : fileObj.name}
                  </FileUploaderLabel>
                }
                onDelete={() => {
                  if (!readOnly) {
                    handleRemoveFile(fileObj.id);
                  }
                }}
                deleteIcon={
                  <CloseIcon
                    sx={{
                      color: `${prosperRedBorder}!important`,
                      marginRight: '16px!important',
                    }}
                  />
                }
                color={fileObj.error ? 'error' : 'default'}
              />
              {fileObj.error && (
                <Typography variant="caption" color="error">
                  {fileObj.error}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      </Box>
      <input
        accept="*"
        style={{ display: 'none' }}
        id="file-input"
        type="file"
        multiple
        onChange={handleAddFile}
        ref={fileInputRef}
      />
      {!readOnly && (
        <label htmlFor="file-input">
          <Button
            sx={{
              boxShadow: 'none',
              height: '44px',
              backgroundColor: prosperBoxGreen,
              fontSize: '16px',
              fontWeight: 300,
              pt: '10px',
              textTransform: 'uppercase',
            }}
            variant="contained"
            component="span"
            startIcon={<AddIcon sx={{ transform: 'translate(6px, -2px)' }} />}
          >
            {i18next.t('add')}
          </Button>
        </label>
      )}
      {readOnly && !files.length && (
        <Typography component="h3">No documents available</Typography>
      )}
    </Box>
  );
};

export default FileUploader;
