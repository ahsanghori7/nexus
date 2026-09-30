import React, { useMemo } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid2';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';
import { InputForm, InputFormControlled, Form } from 'clink-components';
import { StyledPageSubtitle, StyledTeamReset } from './styled';

const HeaderContent = () => {
  const { t } = useTranslation();
  return (
    <StyledPageSubtitle className="page-subtitle">
      {t('invite-outside')}
    </StyledPageSubtitle>
  );
};
const isInternalUseRoles = ['administrator', 'project_team_member'];

const InvitePanel = ({
  loading,
  sendInvite,
  inviteError,
  theme,
  resetButton,
  userRole,
  roles,
}) => {
  const { t } = useTranslation();
  const userRoleData = useMemo(() => {
    return roles?.find((type) => type.value === userRole);
  }, [userRole, roles]);

  const filteredOptions = useMemo(() => {
    if (!userRoleData) return [];

    if (userRole === 'super_admin') {
      console.log('Filtered options for super_admin:', roles);
      return roles?.filter(
        (type) =>
          Number(type.level) >= Number(userRoleData.level) &&
          !isInternalUseRoles.includes(type.value),
      );
    }
    return roles?.filter(
      (type) =>
        Number(type.level) > Number(userRoleData.level) &&
        !isInternalUseRoles.includes(type.value),
    );
  }, [userRoleData, roles]);
  return (
    <Grid className="team-panel team-panel-invite" container>
      <Grid size={12}>
        <HeaderContent />
      </Grid>
      <Grid
        size={12}
        sx={{
          height: { xs: 'auto', lg: '160px' },
          '& > form': { display: 'block' },
        }}
      >
        <Form
          data-testid="form-content"
          disableUntilValid
          defaultValues={{ name: '', email: '', role: null }}
          onSubmit={sendInvite}
          render={(formHook) => {
            const {
              formState,
              register,
              setValue,
              control,
              setError,
              clearErrors,
              resetField,
            } = formHook;
            const { errors, isValid } = formState;
            if (
              inviteError &&
              (!('email' in errors) ||
                (errors.email.message !== inviteError &&
                  !errors.email.message.includes('required') &&
                  !errors.email.message.includes('valid')))
            ) {
              const message =
                errors.email &&
                errors.email.message &&
                (errors.email.message.includes('required') ||
                  errors.email.message.includes('valid'))
                  ? errors.email.message
                  : inviteError;
              setError('email', { message });
            } else if (!inviteError && 'email' in errors && isValid) {
              clearErrors('email');
            }
            return (
              <Grid container spacing={2} p={3} alignItems="flex-start">
                <Grid size={{ xs: 12, md: 3 }}>
                  <InputForm
                    autoComplete="name"
                    errors={errors}
                    placeholder={t('insert-user-name')}
                    register={register}
                    setValue={setValue}
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      e.target.type !== 'textarea' &&
                      e.preventDefault()
                    }
                    name="name"
                    type="text"
                    label="Name"
                    rules={{ required: 'Name is required' }}
                    data-testid="invite-name-input"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <InputForm
                    autoComplete="email"
                    errors={errors}
                    placeholder={t('insert-user-email')}
                    register={register}
                    setValue={setValue}
                    name="email"
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      e.target.type !== 'textarea' &&
                      e.preventDefault()
                    }
                    type="email"
                    label="Email"
                    data-testid="invite-email-input"
                    rules={{
                      required: 'Email is required',
                      pattern: {
                        value:
                          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                        message: 'The email is not valid',
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <InputFormControlled
                    className="option-test"
                    autoComplete="role"
                    data-testid="invite-role-select"
                    errors={errors}
                    placeholder="Select from list"
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      e.target.type !== 'textarea' &&
                      e.preventDefault()
                    }
                    register={register}
                    setValue={(name, value) => {
                      formHook.setValue(name, value, {
                        shouldValidate: true,
                      });
                    }}
                    control={control}
                    name="role"
                    type="select"
                    label="User type"
                    rules={{ required: 'Role is required' }}
                    theme={theme}
                    options={filteredOptions.map((role) => ({
                      label: role.label,
                      value: role.id,
                    }))}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }} sx={{ marginTop: 3 }}>
                  <StyledTeamReset>
                    <Button
                      type="button"
                      ref={resetButton}
                      data-testid="invite-reset-button"
                      onClick={() => {
                        resetField('name');
                        resetField('email');
                        resetField('role');
                      }}
                    >
                      {t('reset')}
                    </Button>
                  </StyledTeamReset>
                  {!loading && (
                    <Button
                      type="submit"
                      color="success"
                      variant="contained"
                      id="invite-to-team-button"
                      data-testid="invite-submit-button"
                    >
                      {t('invite-to-team')}
                    </Button>
                  )}
                  {loading && <CircularProgress />}
                </Grid>
              </Grid>
            );
          }}
        />
      </Grid>
    </Grid>
  );
};
export default InvitePanel;
