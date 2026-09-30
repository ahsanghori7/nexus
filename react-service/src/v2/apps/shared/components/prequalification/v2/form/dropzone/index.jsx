import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import FormControl from '@mui/material/FormControl';
import Input from '@mui/material/Input';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';
import {
  MuiSubtitle,
  MuiCompanyAvatar,
} from 'v2/apps/shared/components/company-v2/Mui.styled';
import Button from 'v2/apps/shared/components/prequalification/v2/Button';

const desc =
  'File size must be no bigger than 200k, any images should be in either a .jpg, .pdf or .png format';

/**
 * The uploaded files would appear in a list, showing the original_file and being clickable for redirecting to the 'document' link.
 * Example: value = [{ original_file: 'file.pdf', document: 'https://clink-uat-docs.s3.eu-west-2.amazonaws.com/staging/file.pdf'}];
 */

const DropWrapper = ({ children, dropzone, registerVars }) => {
  if (dropzone) {
    const handleDrop = (e) => {
      if (e.dataTransfer && e.dataTransfer.files.length !== 0) {
        registerVars.onChange({ currentTarget: e.dataTransfer.files });
      }
    };
    return (
      <div
        id="custom-dropzone"
        onChange={registerVars.onChange}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        {children}
      </div>
    );
  }
  return children;
};

const FileImage = ({
  name = 'document',
  label = '',
  register,
  errors,
  value = [],
  multiple = false,
  description = desc,
  actionLabel = 'Choose file',
  dropzone = false,
  logo = false,
  setLogo = false,
}) => {
  const { t } = useTranslation();
  const [internalValue, setInternalValue] = useState(value);
  const fileInputRef = useRef();

  const handleFileButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleOnChange = (e) => {
    const { files } = e.currentTarget;
    if (!files) {
      return;
    }
    const filesArray = Array.from(files).map((f) => ({
      original_file: f.name,
      document: '',
    }));

    if (multiple) {
      setInternalValue([...internalValue, ...filesArray]);
    } else {
      setInternalValue(filesArray);
    }
  };

  const registerVars = {
    ...register(name, {
      onChange: (e) => {
        const [file] = e.target.files;
        if (file) {
          setLogo(URL.createObjectURL(file));
        }
        handleOnChange(e);
      },
    }),
  };

  return (
    <FormControl fullWidth>
      {logo ? (
        <Box sx={{ '& .MuiBox-root': { minHeight: 'auto' } }}>
          {Boolean(label) && <MuiSubtitle>{label}</MuiSubtitle>}
          <MuiCompanyAvatar
            picSrc={logo}
            onDelete={() => setLogo && setLogo(false)}
          />
        </Box>
      ) : (
        <DropWrapper dropzone={dropzone} registerVars={registerVars}>
          {Boolean(label) && (
            <MuiSubtitle sx={{ mb: { xs: '4px', lg: '10px' } }}>
              {label}
            </MuiSubtitle>
          )}
          <Typography sx={{ fontSize: '14px', fontWeight: 300 }}>
            {t('upload-avatar')}
          </Typography>
          <Input
            sx={{ display: 'none' }}
            type="file"
            name={name}
            inputRef={fileInputRef}
            multiple={multiple}
            {...registerVars}
          />
          <Button
            sx={{ fontSize: '17px', mb: { xs: 3, lg: 0 } }}
            type="button"
            variant="contained"
            color="success"
            label={actionLabel}
            onClick={handleFileButtonClick}
            fullWidth
          />
          {errors[name] && (
            <FormHelperText error>{errors[name]}</FormHelperText>
          )}
          {Boolean(description) && (
            <Typography
              sx={{
                display: { xs: 'none', lg: 'block' },
                fontSize: '12px',
                fontWeight: '100',
                textAlign: 'center',
                pt: 1,
              }}
            >
              {description}
            </Typography>
          )}
        </DropWrapper>
      )}
    </FormControl>
  );
};

export default FileImage;
