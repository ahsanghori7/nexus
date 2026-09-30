import React from 'react';
import Box from '@mui/material/Box';
import { CONSTANTS, InputFormControlled } from 'clink-components';

const { prosperBoxRed } = CONSTANTS.colors.prosper;

const MAX_LENGTH = 500;
const TextEditor = ({
  register,
  setValue,
  errors,
  trigger,
  control,
  label,
}) => {
  return (
    <Box
      sx={{
        mb: 2,
        '& label': {
          fontSize: '14px',
          color: prosperBoxRed,
          fontWeight: 'bold',
          my: '10px',
        },
      }}
    >
      <InputFormControlled
        register={register}
        rules={{
          required: 'Description required',
          validate: (v) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(v, 'text/html');
            const text = doc.body.textContent || '';
            return text.length > MAX_LENGTH
              ? 'Please ensure that your text is limited to 500 characters or fewer.'
              : true;
          },
        }}
        setValue={setValue}
        autoComplete="description"
        label={label && label.length && label}
        errors={errors}
        name="description"
        type="editor"
        trigger={trigger}
        control={control}
      />
    </Box>
  );
};

export default TextEditor;
