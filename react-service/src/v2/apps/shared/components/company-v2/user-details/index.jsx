import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import { sizeFileIsCorrect, typeFileIsAccepted } from 'v2/helpers/files';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Form as ClinkForm } from 'clink-components';
import { useTranslation } from 'react-i18next';
import { checkIfImageExists } from 'v2/helpers/url';
import Loading from 'v2/apps/shared/components/Loading';
import {
  MuiSubtitle,
  MuiSubmitWrapper,
} from '../Mui.styled';
import UserDetailsInputs from './UserDetailsInputs';
import ImageDropzone from 'v2/apps/shared/components/image-dropzone';

const UserDetails = ({
  data,
  id,
  company,
  dispatch,
  contextType,
  handleUpdate,
  page,
  setTabSelected,
}) => {
  const { t } = useTranslation();
  const context = useContext(contextType);
  const { actions } = context;
  const { logos } = company;
  const { logo: profLogo } = logos;

  const [profileLogo, setProfileLogo] = useState('');
  const [profileLogoExists, setProfileLogoExists] = useState(false);
  const [profileLogoLoading, setProfileLogoLoading] = useState(true);
  const [profileLogoVerify, setProfileLogoVerify] = useState('');
  const [selectedProfileFile, setSelectedProfileFile] = useState(null);

  const acceptedTypes = ['image/jpeg', 'image/png'];
  const profileMaxSize = 0.5;

  useEffect(() => {
    checkIfImageExists(profLogo, (exists) => {
      if (exists) setProfileLogo(profLogo);
    });
  }, [profLogo, selectedProfileFile]);

  useEffect(() => {
    checkIfImageExists(profileLogo, (exists) => {
      setProfileLogoExists(exists);
      setProfileLogoLoading(false);
    });
  }, [profileLogoExists, profileLogoLoading, profileLogo, profLogo]);

  const handleUpdateProfileImage = (e, type, trigger) => {
    const { files } = e.target;
    const selectedFile = files[0];

    if (!sizeFileIsCorrect(selectedFile, profileMaxSize)) {
      setProfileLogoVerify(t('file-too-large_one'));
      return;
    }

    if (!typeFileIsAccepted(selectedFile, acceptedTypes)) {
      setProfileLogoVerify(t('invalid-type-file_one'));
      return;
    }

    setProfileLogoLoading(true);
    setProfileLogoVerify('');
    setSelectedProfileFile(selectedFile);

    dispatch(actions.updateCompanyImage({ id, files, type })).then(() => {
      setProfileLogoLoading(false);
      trigger(['profile-image']);
    });
  };

  const handleDeleteImage = (trigger, type) => {
    dispatch(actions.removeCompanyImage({ id, profileLogo, type })).then(() => {
      setProfileLogo('');
      trigger(['profile-image']);
    });
  };

  const handleSubmit = (dataS) => {
    handleUpdate(dataS);
    setTabSelected(page + 1);
  };

  return (
    <ClinkForm
      disableUntilValid
      method="POST"
      onSubmit={handleSubmit}
      render={(formHook) => {
        const { formState, register, trigger } = formHook;
        const { errors, isValid } = formState;

        const disabledSubmit = !isValid;

        return (
          <Box>
            <Box
              sx={{
                width: '100%',
                mt: 4,
                '& input[name="profile-image"]': {
                  display: profileLogo ? 'none' : 'block',
                },
              }}
            >
              {profileLogoLoading && (
                <Loading status="Loading profile logo..." />
              )}

              <MuiSubtitle>{t('profile-picture')}</MuiSubtitle>

              {!profileLogoLoading && (
                <ImageDropzone
                  theme="prosper-preq-v2"
                  name="profile-image"
                  maxSize={profileMaxSize}
                  acceptedTypes={acceptedTypes}
                  existingImageUrl={profileLogo}
                  onFileSelect={(e) =>
                    handleUpdateProfileImage(e, 'logo', trigger)
                  }
                  onDelete={() => handleDeleteImage(trigger, 'logo')}
                  register={register}
                  errors={errors}
                  fileErrorMessage={profileLogoVerify}
                  hideDropzoneIfPreview
                  className="company-profile-input"
                />
              )}
            </Box>

            <Box sx={{ width: '100%' }}>
              <UserDetailsInputs
                data={data}
                register={register}
                errors={errors}
              />
              <MuiSubmitWrapper>
                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  size="large"
                  disabled={disabledSubmit}
                >
                  {t('save-continue')}
                </Button>
              </MuiSubmitWrapper>
            </Box>
          </Box>
        );
      }}
    />
  );
};

const mapStateToProps = (state) => ({
  company: state.company,
  subcontractor: state.subcontractor,
});

export default connect(mapStateToProps)(UserDetails);
