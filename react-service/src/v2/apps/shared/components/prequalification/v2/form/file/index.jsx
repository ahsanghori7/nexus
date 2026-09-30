import React, { useRef, useState } from 'react';
import FormControl from '@mui/material/FormControl';
import Input from '@mui/material/Input';
import Typography from '@mui/material/Typography';
import FormHelperText from '@mui/material/FormHelperText';
import { sizeFileIsCorrect, typeFileIsAccepted } from 'v2/helpers/files';
import { MuiSubtitle } from 'v2/apps/shared/components/company-v2/Mui.styled';
import Button from '../../Button';
import FileList from './FileList';

const desc =
  'File size must be no bigger than 5mb, any images should be in either a .jpg, .pdf or .png format';

const allowedFileTypes = ['image/jpeg', 'image/png', 'application/pdf'];
const maxFileSize = 5; // Mb
const validateFile = (value) => {
  const file = value && value[0];
  // If nothing to validate (e.g., input just got cleared), don't fail size/type checks
  if (!file) return true;

  // If document came from backend, skip validation
  if (file.document && file.document.length) return true;

  if (!sizeFileIsCorrect(file, maxFileSize)) return 'File too large';
  if (!typeFileIsAccepted(file, allowedFileTypes)) return 'Invalid type file';
  return true;
};

/**
 * The uploaded files would appear in a list, showing the original_file and being clickable for redirecting to the 'document' link.
 * Example: value = [{ original_file: 'file.pdf', document: 'https://clink-uat-docs.s3.eu-west-2.amazonaws.com/staging/file.pdf'}];
 */

const File = ({
  name = 'document',
  label = '',
  trigger = () => null,
  resetField,
  setValue = () => null,
  register,
  errors,
  value = [],
  validate = null,
  multiple = false,
  description = desc,
  actionLabel = 'Choose file',
  requiredFile = true,
  getDocInfo = null,
  originalFile = null,
  callbackDelete = () => null,
  callbackAddFile = () => null,
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const fileInputRef = useRef();

  const handleFileButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleRemoveFile = () => {
    setInternalValue([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    trigger([name]);
    resetField?.(name);
    callbackDelete(name);
  };

  const handleOnChange = (e) => {
    const { files, name: nameInput } = e.currentTarget;

    const filesArray = Array.from(files).map((f) => ({
      original_file: f.name,
      document: '',
    }));

    setInternalValue((prev) => (multiple ? [...prev, ...filesArray] : filesArray));
    if (files && files.length) {
      const filesList = multiple ? Array.from(files) : [files[0]];
      setValue(nameInput, filesList);
    }
    callbackAddFile(nameInput);

    setTimeout(() => {
      e.target.value = '';
    }, 0);
  };


  const reqFile = !internalValue.length ? 'Required' : false;
  const isRequired = requiredFile ? reqFile : false;

  return (
    <FormControl fullWidth>
      {Boolean(label) && <MuiSubtitle>{label}</MuiSubtitle>}
      <Input
        sx={{ display: 'none' }}
        type="file"
        name={name}
        inputRef={fileInputRef}
        multiple={multiple}
        {...register(name, {
          required: isRequired,
          onChange: handleOnChange,
          ...(validate
            ? { validate }
            : {
              validate: (v) => {
                if (internalValue.length) {
                  return validateFile(v);
                }
                return isRequired ? 'Required' : true;
              },
            }),
        })}
      />
      {!internalValue.length && (
        <Button
          type="button"
          variant="contained"
          color="success"
          label={actionLabel}
          onClick={handleFileButtonClick}
          fullWidth
        />
      )}
      {errors[name] && (
        <FormHelperText error>{errors[name].message}</FormHelperText>
      )}
      {!Boolean(internalValue.length) && originalFile && (
        <Typography sx={{ fontSize: 12, m: 1, textDecoration: 'underline' }}>
          Uploaded file: {originalFile}
        </Typography>
      )}
      {!internalValue.length && Boolean(description) && (
        <Typography
          sx={{ fontSize: '12px', fontWeight: '100', paddingTop: '12px' }}
        >
          {description}
        </Typography>
      )}
      {Boolean(internalValue.length) && (
        <FileList
          name={name}
          removeFile={handleRemoveFile}
          files={internalValue}
          getDocInfo={getDocInfo}
        />
      )}
    </FormControl>
  );
};

export default File;
