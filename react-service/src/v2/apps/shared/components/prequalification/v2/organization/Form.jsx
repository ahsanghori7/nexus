import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Input from '@mui/material/Input';
import Typography from '@mui/material/Typography';
import { CONSTANTS } from 'clink-components';
import { checkIfImageExists } from 'v2/helpers/url';

// TODO: Add from backend?
import {
  DIRECTOR,
  TENDERING,
  CONSTRUCTION,
  COMMERCIAL,
  ENVIRONMENT,
  WITNESS,
  OTHER,
  ROLE_CHECKER,
} from 'v2/helpers/prequal/organization';
import Select from '../form/Select';
import Button from '../Button';
import Text from '../form/Text';
import SwitchBox from '../form/SwitchBox';
import Number from '../form/Number';
import FileImage from '../form/dropzone';

const { white } = CONSTANTS.colors.general;
const { iconHammerBlack } = CONSTANTS.s3;

const Form = ({ handleOnSubmit, data = null, fileError = null }) => {
  const otherValue = data && data.role_input;
  const [other, setOther] = useState(otherValue);
  const [isWitness, setIsWitness] = useState();
  const [defaultOther] = useState(otherValue);
  const [logo, setLogo] = useState(iconHammerBlack);
  const { t } = useTranslation();

  useEffect(() => {
    if (data) {
      checkIfImageExists(data.logo, (exists) => {
        if (exists) {
          setLogo(data.logo);
        }
      });
    }
  }, [data]);

  useEffect(() => {
    if (data && data.role) {
      setIsWitness(String(data.role) === String(WITNESS.value));
    }
  }, [data]);

  const handleOther = (e) => {
    setOther(String(e.target.value) === String(OTHER.value));
    setIsWitness(String(e.target.value) === String(WITNESS.value));
  };

  const role = data ? ROLE_CHECKER[data.role] : '';
  const roleInput = data ? data.role_input : '';

  const defaultValues = {
    id: data ? data.id : '',
    role: defaultOther ? OTHER.value : role,
    role_input: defaultOther ? roleInput : '',
    firstname: data ? data.firstname : '',
    lastname: data ? data.lastname : '',
    phone: data ? data.phone : '',
    email: data ? data.email : '',
    permission: data ? Boolean(data.user_id) : false,
  };

  const {
    reset,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues });

  return (
    <Box
      component="form"
      onSubmit={handleSubmit((submitData) => {
        handleOnSubmit(submitData, logo, data && data.logo);
        reset();
      })}
    >
      <Box sx={{ marginBottom: '100px' }}>
        <Input name="id" type="hidden" />
        <FileImage
          name="picture"
          label="Avatar"
          errors={fileError ? { picture: fileError } : {}}
          register={register}
          logo={logo}
          setLogo={setLogo}
          description="File size must be no bigger than 1MB, any images should be in either a .jpg or .png format"
          dropzone
        />
        <Select
          label={t('role')}
          name="role"
          register={register}
          errors={errors}
          options={[
            DIRECTOR,
            TENDERING,
            CONSTRUCTION,
            COMMERCIAL,
            ENVIRONMENT,
            WITNESS,
            OTHER,
          ]}
          defaultValue={defaultValues.role}
          handleChange={handleOther}
        />
        {other && (
          <Text
            sx={{ mt: 1 }}
            name="role_input"
            value={0}
            register={register}
            errors={errors}
          />
        )}
        <Text
          sx={{ mt: 1 }}
          label={t('profile-firstname')}
          name="firstname"
          value={0}
          register={register}
          errors={errors}
          required
        />
        <Text
          sx={{ mt: 1 }}
          label={t('profile-lastname')}
          name="lastname"
          value={0}
          register={register}
          errors={errors}
          required
        />
        <Number
          sx={{ mt: 1 }}
          label={t('profile-company-phone')}
          name="phone"
          value={0}
          register={register}
          errors={errors}
        />
        <Text
          sx={{ mt: 1 }}
          label={t('email')}
          name="email"
          type="email"
          value={0}
          register={register}
          errors={errors}
          required
        />
        {!isWitness && (
          <Box>
            <Typography
              sx={{
                mt: 2,
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              {t('organization-permissions')}
            </Typography>
            <SwitchBox
              value={defaultValues.permission}
              name="permission"
              checkboxLabel={t('organization-permissions-edit')}
              register={register}
            />
            <Typography
              sx={{
                mt: 1,
                fontSize: '14px',
                fontWeight: '100',
              }}
            >
              {t('organization-permissions-desc')}
            </Typography>
          </Box>
        )}
      </Box>
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: '14px',
          px: 3,
          pb: 3,
          backgroundColor: white,
        }}
      >
        <Button
          sx={{ fontSize: '17px', fontWeight: 'bold' }}
          type="submit"
          variant="contained"
          color="error"
          fullWidth
        >
          {t('confirm')}
        </Button>
      </Box>
    </Box>
  );
};

export default Form;
