import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import i18next from 'v2/helpers/i18n';
import { CONSTANTS } from 'clink-components';
import {
  MuiModalErrorTable,
  MuiModalTable,
  MuiModalUploadItem,
  MuiModalButton,
} from 'v2/apps/clink/pages/boq/upload/modal-components.mui';

const { clinkGreen, brightGray, white, clinkRed } = CONSTANTS.colors.general;

const getContent = (
  errorTable,
  uploadFile,
  file,
  updateEntity,
  handleFileChange,
  handleUploadFile,
  handleBack
) => {
  let content;
  if (errorTable?.length) {
    content = (
      <Box
        sx={{
          height: '100%',
          position: 'relative',
        }}
      >
        <MuiModalErrorTable
          maxHeight="660px"
          maxWidth="800px"
          tableContent={errorTable}
          file={file}
        />
        <MuiModalButton
          sx={{
            backgroundColor: clinkRed,
            mt: 1,
            mb: 1,
            '&:hover': { backgroundColor: clinkRed },
          }}
          onClick={handleBack}
        >
          {i18next.t('go-back')}
        </MuiModalButton>
      </Box>
    );
  } else if (uploadFile?.length) {
    content = (
      <Box
        sx={{
          height: '100%',
          position: 'relative',
        }}
      >
        <MuiModalTable maxHeight="660px" tableContent={uploadFile} />
        <MuiModalButton
          sx={{
            backgroundColor: clinkGreen,
            mt: 1,
            '&:hover': { backgroundColor: clinkGreen },
          }}
          onClick={() => updateEntity(uploadFile)}
        >
          {i18next.t('continue')}
        </MuiModalButton>
      </Box>
    );
  } else if (file) {
    content = (
      <Box sx={{ height: 'calc(100% - 30px)' }}>
        <Box
          sx={{
            backgroundColor: brightGray,
            width: '60%',
            height: '100%',
            maxHeight: '200px',
            margin: '40px auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DescriptionIcon sx={{ fontSize: 100, backgroundColor: white }} />
        </Box>
        <Box
          sx={{
            width: '60%',
            margin: 'auto',
          }}
        >
          <MuiModalUploadItem
            fileName={file.name}
            size={file.size}
            onClick={handleBack}
          />
        </Box>
        <MuiModalButton onClick={handleUploadFile}>
          {i18next.t('upload-one-file')}
        </MuiModalButton>
      </Box>
    );
  } else {
    content = (
      <Box
        sx={{
          backgroundColor: brightGray,
          padding: '20px',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <CloudUploadIcon sx={{ fontSize: 80, opacity: '0.5' }} />
        <Typography variant="h6" sx={{ m: 0 }}>
          <label htmlFor="file-input">
            <input
              id="file-input"
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Button
              variant="text"
              component="span"
              sx={{
                color: clinkGreen,
                fontSize: 'inherit',
                p: 0,
                textDecoration: 'underline',
              }}
            >
              {i18next.t('boq-browse-file')}
            </Button>
          </label>
        </Typography>
      </Box>
    );
  }

  return content;
};

export default getContent;
