import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import { Box, CircularProgress } from '@mui/material';
import {
  Panel,
  Form as ClinkForm,
  Button,
} from 'clink-components';
import { useTranslation } from 'react-i18next';
import { checkIfImageExists } from 'v2/helpers/url';
import { getCompanyLogo } from 'v2/helpers/user';
import Loading from 'v2/apps/shared/components/Loading';
import {
  StyledLogoWrapper,
  StyledLogoColumnPrimary,
  StyledLogoColumnSecondary,
} from './styled';
import UserDetailsInputs from './UserDetailsInputs';
import ImageDropzone from 'v2/apps/shared/components/image-dropzone';

const UserDetails = ({
  id,
  contextType,
  cssClass,
  company,
  dispatch,
  data,
  loading,
  handleUpdate,
}) => {
  const { t } = useTranslation();
  const context = useContext(contextType);
  const { actions } = context;
  const { logos } = company;
  const { company: compLogo } = logos;

  const [companyLogo, setCompanyLogo] = useState(compLogo);
  const [companyLogoExists, setCompanyLogoExists] = useState(false);
  const [companyLogoLoading, setCompanyLogoLoading] = useState(true);
  const [companyLogoVerify, setCompanyLogoVerify] = useState('');

  const acceptedTypes = ['image/jpeg', 'image/png'];
  const companyMaxSize = 0.5; // MB

  useEffect(() => {
    checkIfImageExists(companyLogo, (exists) => {
      setCompanyLogoExists(exists);
      setCompanyLogoLoading(false);
    });
  }, [companyLogo]);

  const handleUpdateCompanyImage = (e, type, trigger) => {
    const { files } = e.target;
    const selectedFile = files?.[0];
    if (!selectedFile) return;

    if (!sizeFileIsCorrect(selectedFile, companyMaxSize)) {
      setCompanyLogoVerify(t('file-too-large_one'));
      return;
    }
    if (!typeFileIsAccepted(selectedFile, acceptedTypes)) {
      setCompanyLogoVerify(t('invalid-type-file_one'));
      return;
    }

    setCompanyLogoLoading(true);
    setCompanyLogoVerify('');

    dispatch(actions.updateCompanyImage({ id, files, type })).then(() => {
      setCompanyLogo(getCompanyLogo(id));
      setCompanyLogoLoading(false);
      trigger(['company-logo']);
    });
  };

  const handleDeleteCompanyImage = (trigger, type) => {
    dispatch(actions.removeCompanyImage({ id, companyLogo, type })).then(() => {
      setCompanyLogo('');
      trigger(['company-logo']);
    });
  };

  return (
    <Panel className={cssClass && `${cssClass}`}>
      <ClinkForm
        disableUntilValid
        method="POST"
        onSubmit={handleUpdate}
        render={(formHook) => {
          const { formState, register, trigger } = formHook;
          const { errors, isDirty, isValid } = formState;
          const disabledSubmit = !isDirty || !isValid;

          return (
            <StyledLogoWrapper className="cover-image-panel">
              <StyledLogoColumnPrimary>
                <Panel headerContent={<h2>{t('profile-user-details')}</h2>}>
                  <Box sx={{ width: '100%', height: '100%' }}>
                    <UserDetailsInputs
                      data={data}
                      register={register}
                      errors={errors}
                    />
                    <Box
                      sx={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        mt: 4,
                      }}
                    >
                      {loading && (
                        <CircularProgress className="my-company-loading" />
                      )}
                      <Button
                        id="submit-button"
                        type="submit"
                        layout="square"
                        color="prosperGreenButton"
                        disabled={disabledSubmit}
                        data-testid="user-details-button-save"
                      >
                        {t('save')}
                      </Button>
                    </Box>
                  </Box>
                </Panel>
              </StyledLogoColumnPrimary>
              <StyledLogoColumnSecondary>
                <Panel headerContent={<h2>{t('profile-company-logo')}</h2>}>
                  {companyLogoLoading ? (
                    <Loading status="Loading company logo..." />
                  ) : (
                    <ImageDropzone
                      theme="prosper-small"
                      name="company-logo"
                      maxSize={companyMaxSize}
                      register={register}
                      errors={errors}
                      existingImageUrl={companyLogoExists ? companyLogo : ''}
                      fileErrorMessage={companyLogoVerify}
                      onFileSelect={(e) =>
                        handleUpdateCompanyImage(e, 'company', trigger)
                      }
                      onDelete={() => handleDeleteCompanyImage(trigger, 'company')}
                      hideDropzoneIfPreview
                      className="company-profile-input"
                    />
                  )}
                </Panel>
              </StyledLogoColumnSecondary>
            </StyledLogoWrapper>
          );
        }}
      />
    </Panel>
  );
};

const mapStateToProps = (state) => ({
  company: state.company,
  subcontractor: state.subcontractor,
});

export default connect(mapStateToProps)(UserDetails);
