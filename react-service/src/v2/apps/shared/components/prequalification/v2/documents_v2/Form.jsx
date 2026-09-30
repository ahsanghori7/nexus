import React from 'react';
import Box from '@mui/material/Box';
import Input from '@mui/material/Input';
import Button from 'v2/apps/shared/components/prequalification/v2/Button';
import { useTranslation } from 'react-i18next';
import CautionMessage from './CautionMessage';
import useDocumentsForm from './useDocumentsForm';

const Form = ({
  aid,
  data,
  type,
  options = [],
  selectedOptions = [],
  handleOnSubmit,
  Inputs,
  showOtherOptionForAll = false,
}) => {
  const { t } = useTranslation();
  const documentsForm = useDocumentsForm(data, type);

  if (!type) {
    return null;
  }

  const { handleSubmit, reset } = documentsForm;
  const requested = data && data.requested;

  return (
    <Box
      sx={{ '& .MuiFormControl-root': { pb: 1 } }}
      component="form"
      onSubmit={handleSubmit((submitData) => {
        handleOnSubmit(submitData);
        reset();
      })}
    >
      {requested && <CautionMessage />}
      <Input name="id" type="hidden" />
      <Input name="section" type="hidden" />
      <Inputs
        aid={aid}
        data={data}
        documentsForm={documentsForm}
        options={options}
        selectedOptions={selectedOptions}
        showOtherOptionForAll={showOtherOptionForAll}
      />
      <Button type="submit" variant="contained" color="error" fullWidth>
        {t('confirm')}
      </Button>
    </Box>
  );
};

export default Form;
