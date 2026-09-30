import React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Input from '@mui/material/Input';
import Date from '../form/Date';
import Money from '../form/Money';
import Text from '../form/Text';
import Button from '../Button';
import Textarea from '../form/Textarea';

const FormReference = ({ data, handleOnSubmit }) => {
  const { t } = useTranslation();
  const defaultValues = {
    section: 'references',
    id: data ? data.id : '',
    project_name: data ? data.project_name : '',
    client_name: data ? data.client_name : '',
    completion_date: data ? data.completion_date : '',
    contract_value: data ? data.contract_value : '',
    contact_name: data ? data.contact_name : '',
    contact_email: data ? data.contact_email : '',
    sow: data ? data.sow : '',
    document: data
      ? [
          {
            original_file: data.original_file,
            document: data.document,
          },
        ]
      : [],
  };

  const {
    reset,
    trigger,
    register,
    setValue,
    getValues,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({ defaultValues, mode: 'onTouched' });

  const values = getValues();
  const {
    completion_date: currentCompletionDate,
    contract_value: currentContractValue,
  } = values;

  return (
    <Box
      sx={{ '& .MuiFormControl-root': { pb: 1 } }}
      component="form"
      onSubmit={handleSubmit((submitData) => {
        handleOnSubmit(submitData);
        reset();
      })}
    >
      <Input name="id" type="hidden" />
      <Input name="section" type="hidden" />
      <Text
        name="project_name"
        label={t('text-project-name')}
        register={register}
        errors={errors}
        required="true"
      />
      <Text
        name="client_name"
        label={t('references-client_name')}
        register={register}
        errors={errors}
        required="true"
      />
      <Date
        name="completion_date"
        label={t('completion')}
        setValue={setValue}
        register={register}
        trigger={trigger}
        errors={errors}
        value={currentCompletionDate}
      />
      <Money
        name="contract_value"
        label={t('references-contract_value')}
        register={register}
        errors={errors}
        value={currentContractValue}
      />
      <Text
        name="contact_name"
        label={t('references-contact_name')}
        register={register}
        errors={errors}
        required="true"
      />
      <Text
        name="contact_email"
        label={t('references-contact_email')}
        register={register}
        required="true"
        type="email"
        errors={errors}
      />

      <Textarea
        name="sow"
        label={t('references-sow')}
        register={register}
        errors={errors}
      />

      <Button type="submit" variant="contained" color="error" fullWidth disabled={!isValid}>
        {t('confirm')}
      </Button>
    </Box>
  );
};

export default FormReference;
