import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import PHPGloblals, { PHPAppClinkGloblals } from 'v2/helpers/php-globals';
import { handleUnauthorized } from 'v2/helpers/session';
import { getAccountLogo } from 'v2/helpers/user';
import {
  PasswordValidationBox,
  RepeatPasswordValidationBox,
  AvatarUpload,
  SaveWrapper,
  MuiTitle,
  ModalBox
} from './mui.styled';
import MuiFormField from './MuiFormField';
import {
  validatePassword as validatePasswordUtil,
  validateField as validateFieldUtil,
  parseFormFieldName,
  checkPasswordsMatch,
  getAllPasswordValidationsPassed,
  getRequiredFieldKeys
} from './utils';

const UpdateProfile = ({ clinkAccount }) => {
  const { t } = useTranslation();

  const conf = PHPGloblals();
  let csrf = false;
  if (conf && conf.csrf) {
    csrf = {
      name: 'csrf_token',
      value: conf.csrf,
    };
  }

  const config = PHPAppClinkGloblals();
  const isHidePasswordField = config && config.hidePasswordField
  const isVisible = clinkAccount?.acl?.companyProfile?.canView ?? true;

  const {
    address,
    company_landline_number: landline,
    email: companyEmail,
    name: companyName,
    reg_number,
    user,
    website,
  } = clinkAccount;

  const {
    contact_number,
    display_name,
    email,
    firstname,
    job_title,
    lastname,
    logo,
    account_id
  } = user;

  const [avatar, setAvatar] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalDescription, setModalDescription] = useState('');

  const [formData, setFormData] = useState({
    user: {
      firstname: firstname || '',
      lastname: lastname || '',
      contact_number: contact_number || '',
      email: email || '',
      job_title: job_title || '',
      display_name: display_name || '',
      password: '',
    },
    account: {
      name: companyName || '',
      logo: logo || '',
      reg_number: reg_number || '',
      address: address || '',
      landline: landline || '',
      email: companyEmail || '',
      website: website || '',
    },
  });

  const [errors, setErrors] = useState({});
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const passValStrings = {
    lowercase: t('update-profile-val-lowercase'),
    uppercase: t('update-profile-val-uppercase'),
    number: t('update-profile-val-number'),
    specialChar: t('update-profile-val-special'),
    minLength: t('update-profile-val-min'),
  };

  const [passwordRules, setPasswordRules] = useState([
    { valid: false, message: passValStrings.lowercase },
    { valid: false, message: passValStrings.uppercase },
    { valid: false, message: passValStrings.number },
    { valid: false, message: passValStrings.specialChar },
    { valid: false, message: passValStrings.minLength },
  ]);

  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const [showPasswordValidation, setShowPasswordValidation] = useState(false);
  const [showRepeatPasswordValidation, setShowRepeatPasswordValidation] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const passwordRef = useRef(null);
  const repeatPasswordRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (passwordRef.current && !passwordRef.current.contains(event.target)) {
        setShowPasswordValidation(false);
      }
      if (repeatPasswordRef.current && !repeatPasswordRef.current.contains(event.target)) {
        setShowRepeatPasswordValidation(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const accountLogo = getAccountLogo(account_id);
    setAvatar(accountLogo);
  }, [account_id]);

  const validatePassword = (password) => {
    const updatedRules = validatePasswordUtil(password, passValStrings);
    setPasswordRules(updatedRules);
  };

  const requiredFieldKeys = getRequiredFieldKeys();

  const validateField = (name, value) => {
    return validateFieldUtil(name, value, t);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (!name.startsWith('account[logo')) {
      setHasChanges(true);
    }

    const errorMsg = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: errorMsg }));

    if (name === 'user[password]') {
      validatePassword(value);
      setShowPasswordValidation(true);
    }

    setFormData((prevData) => {
      return parseFormFieldName(name, value, prevData);
    });
  };

  const isFormValid = () => {
    return requiredFieldKeys.every((key) => {
      const value =
        key.startsWith('user[')
          ? formData.user[key.slice(5, -1)]
          : formData.account[key.slice(8, -1)];
      return !validateField(key, value);
    });
  };

  const handlePasswordConfirmChange = (e) => {
    const value = e.target.value;
    setPasswordConfirm(value);
    setPasswordsMatch(checkPasswordsMatch(formData.user.password, value));
    setShowRepeatPasswordValidation(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isPasswordValid = getAllPasswordValidationsPassed(passwordRules);
    const isRepeatPasswordValid = passwordsMatch;
    const passValid = !isPasswordValid || !isRepeatPasswordValid;

    if (formData.user.password && formData.user.password.trim().length > 0 && passValid) {
      setModalMessage(t('oops'));
      setModalDescription(t('invalid-password'));
      setModalOpen(true);
      return;
    }

    try {
      const emailCheckUrl = `${BASE_URLS.APP_CLINK}/relay?action=account&method=emailExists&email=${encodeURIComponent(formData.user.email)}`;
      const emailRes = await fetch(emailCheckUrl, {
        credentials: 'include',
      });
      if (emailRes.status === 401) { handleUnauthorized(); return; }
      const emailJson = await emailRes.json();

      if (emailJson.exists && formData.user.email !== clinkAccount.user.email) {
        setErrors((prev) => ({
          ...prev,
          'user[email]': t('email-already-exists')
        }));
        return;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Email check failed:', err);
      setModalMessage(t('oops'));
      setModalDescription('');
      setModalOpen(true);
      return;
    }

    const userPayload = { ...formData.user };
    if (!userPayload.password?.trim()) delete userPayload.password;

    const dataToSend = {
      user: userPayload,
      account: { ...formData.account },
    };

    setSaving(true);

    try {
      const fullUrl = `${BASE_URLS.APP_CLINK}/relay?action=account&method=update`;
      const response = await fetch(fullUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf && { 'X-CSRF-Token': csrf.value }),
        },
        body: JSON.stringify(dataToSend),
        credentials: 'include',
      });
      if (response.status === 401) { handleUnauthorized(); return; }

      const contentType = response.headers.get('Content-Type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        if (text.trim().length > 0) {
          // eslint-disable-next-line no-console
          console.error('Unexpected response:', text);
        } else {
          setModalMessage(t('profile-updated'));
          setModalDescription('');
          setModalOpen(true);
          setHasChanges(false);

        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating profile:', error);
      setModalMessage(t('oops'));
      setModalDescription('');
      setModalOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.onload = async () => {
        if (img.width > 150 || img.height > 150) return;

        try {
          const patchPayload = { account: { logo: file.name } };
          const patchRes = await fetch(`${BASE_URLS.APP_CLINK}/relay?action=account&method=update`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...(csrf && { 'X-CSRF-Token': csrf.value }),
            },
            body: JSON.stringify(patchPayload),
            credentials: 'include',
          });
          if (patchRes.status === 401) { handleUnauthorized(); return; }

          if (!patchRes.ok) {
            setModalMessage(t('oops'));
            setModalDescription('Failed to save logo filename — HTTP ' + patchRes.status);
            setModalOpen(true);
            return;
          }

          const logoFormData = new FormData();
          logoFormData.append('logo', file);
          if (csrf) logoFormData.append(csrf.name, csrf.value);

          const uploadRes = await fetch(`${BASE_URLS.APP_CLINK}/relay?action=account&method=updateLogo`, {
            method: 'POST',
            body: logoFormData,
            credentials: 'include',
          });
          if (uploadRes.status === 401) { handleUnauthorized(); return; }

          const contentType = uploadRes.headers.get('content-type') || '';
          let json;

          if (contentType.includes('application/json')) {
            json = await uploadRes.json();
          } else {
            const text = await uploadRes.text();
            try {
              json = JSON.parse(text);
            } catch {
              // eslint-disable-next-line no-console
              console.error('Upload returned non-JSON:', text);
              setModalMessage(t('oops'));
              setModalDescription('Logo upload failed: server returned non-JSON response');
              setModalOpen(true);
              return;
            }
          }

          if (!json.success) {
            setModalMessage(t('oops'));
            setModalDescription('Logo upload failed');
            setModalOpen(true);
            return;
          }

          setModalMessage(t('profile-updated'));
          setModalDescription('');
          setModalOpen(true);


          setAvatar(reader.result);
          setFormData((prevData) => ({
            ...prevData,
            account: { ...prevData.account, logo: file.name },
          }));

        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Upload error:', err);
          setModalMessage(t('oops'));
          setModalDescription('Logo upload crashed');
          setModalOpen(true);
        }
      };

      img.onerror = () => {
        setModalMessage(t('oops'));
        setModalDescription('Invalid image file.');
        setModalOpen(true);
      };

      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      maxWidth={1280}
      sx={{ margin: 'auto' }}
    >
      {isVisible && (<MuiTitle>
        {t('update-profile')}
      </MuiTitle>)}

      <Grid container spacing={4}>
        <Grid item xs={12} md={6} sx={{ ...(!isVisible && { mx: 'auto' }) }}>
          {!isVisible && (<MuiTitle>
            {t('update-profile')}
          </MuiTitle>)}

          <Typography variant="h6" gutterBottom>
            {t('update-profile-pers-info')}
          </Typography>

          <Grid container spacing={4}>
            <Grid item xs={12} sm={6}>
              <MuiFormField
                name="user[firstname]"
                value={formData.user.firstname}
                onChange={handleChange}
                errorMessage={errors['user[firstname]']}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MuiFormField
                name="user[lastname]"
                value={formData.user.lastname}
                onChange={handleChange}
                errorMessage={errors['user[lastname]']}
              />
            </Grid>
          </Grid>

          <Grid container spacing={4}>
            <Grid item xs={12} sm={6}>
              <MuiFormField
                name="user[contact_number]"
                value={formData.user.contact_number}
                onChange={handleChange}
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <MuiFormField
                name="user[email]"
                value={formData.user.email}
                onChange={handleChange}
                type="email"
                errorMessage={errors['user[email]']}
              />
            </Grid>
          </Grid>

          <MuiFormField name="user[job_title]" value={formData.user.job_title} onChange={handleChange} />

          <Typography variant="h6" gutterBottom sx={{ marginTop: '40px' }}>
            {t('update-profile-account-settings')}
          </Typography>

          <MuiFormField name="user[display_name]" value={formData.user.display_name} onChange={handleChange} />

          {!isHidePasswordField && (
            <>
              <Box position="relative" ref={passwordRef}>
                <MuiFormField name="user[password]" value={formData.user.password} onChange={handleChange} type="password" />
                {showPasswordValidation && <PasswordValidationBox rules={passwordRules} />}
              </Box>

              <Box position="relative" ref={repeatPasswordRef}>
                <MuiFormField
                  name="password_confirm"
                  value={passwordConfirm}
                  onChange={handlePasswordConfirmChange}
                  type="password"
                />
                {showRepeatPasswordValidation && <RepeatPasswordValidationBox match={passwordsMatch} />}
              </Box>
            </>
          )}
        </Grid>

        {isVisible && (
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              {t('update-profile-comp-info')}
            </Typography>

            <MuiFormField
              name="account[name]"
              value={formData.account.name}
              onChange={handleChange}
              errorMessage={errors['account[name]']}
            />
            <AvatarUpload avatar={avatar} handleLogoUpload={handleLogoUpload} />
            <MuiFormField
              name="account[reg_number]"
              value={formData.account.reg_number}
              onChange={handleChange}
              type="number"
            />

            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <MuiFormField name="account[address]" value={formData.account.address} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <MuiFormField
                  name="account[landline]"
                  value={formData.account.landline}
                  onChange={handleChange}
                  type="number"
                />
              </Grid>
            </Grid>

            <Grid container spacing={4}>
              <Grid item xs={12} sm={6}>
                <MuiFormField name="account[website]" value={formData.account.website} onChange={handleChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <MuiFormField
                  name="account[email]"
                  value={formData.account.email}
                  onChange={handleChange}
                  type="email"
                  errorMessage={errors['account[email]']}
                />
              </Grid>
            </Grid>
          </Grid>
        )}

        <SaveWrapper>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ px: 3 }}
            disabled={saving || !isFormValid() || !hasChanges}
          >
            {saving ? t('saving') : t('update-profile-save')}
          </Button>
        </SaveWrapper>
      </Grid>
      <ModalBox
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalMessage}
        description={modalDescription}
      />
    </Box>
  );
};

const mapStateToProps = (state) => ({
  clinkAccount: state.clinkAccount,
});

export default connect(mapStateToProps)(UpdateProfile);
