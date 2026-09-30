import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import { sizeFileIsCorrect, typeFileIsAccepted } from 'v2/helpers/files';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Form as ClinkForm, CONSTANTS } from 'clink-components';
import { useTranslation } from 'react-i18next';
import { checkIfImageExists } from 'v2/helpers/url';
import Loading from 'v2/apps/shared/components/Loading';
import { MuiSubmitWrapper, MuiSubtitle, MuiCompanyTitle } from '../Mui.styled';
import ProsperCompanyPage from './ProsperCompanyPage';
import ImageDropzone from 'v2/apps/shared/components/image-dropzone';

const { platinum } = CONSTANTS.colors.general;

const CompanyDetails = ({
  data,
  id,
  company,
  subcontractor,
  dispatch,
  contextType,
  handleUpdate,
  page,
  setTabSelected,
}) => {
  const { t } = useTranslation();
  const checked = data.registered_address === data.operating_company_address;
  const [operatingAddressChecked, setOperatingAddressChecked] =
    useState(checked);

  const context = useContext(contextType);
  const { actions } = context;

  const { logos } = company;
  const { company: compLogo } = logos;
  const { country } = subcontractor;

  const [companyLogo, setCompanyLogo] = useState('');
  const [companyLogoExists, setCompanyLogoExists] = useState(false);
  const [companyLogoLoading, setCompanyLogoLoading] = useState(true);
  const [companyLogoVerify, setCompanyLogoVerify] = useState('');
  const [selectedCompanyLogo, setSelectedCompanyLogo] = useState(null);

  const acceptedTypes = ['image/jpeg', 'image/png'];
  const companyMaxSize = 0.5;

  useEffect(() => {
    let isMounted = true;

    checkIfImageExists(compLogo, (exists) => {
      if (isMounted && exists) {
        setCompanyLogo(compLogo);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [compLogo, selectedCompanyLogo]);

  useEffect(() => {
    let isMounted = true;

    checkIfImageExists(compLogo, (exists) => {
      if (isMounted && exists) {
        setCompanyLogo(compLogo);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [compLogo, selectedCompanyLogo]);

  useEffect(() => {
    checkIfImageExists(companyLogo, (exists) => {
      setCompanyLogoExists(exists);
      setCompanyLogoLoading(false);
    });
  }, [companyLogoExists, companyLogoLoading, companyLogo, compLogo]);

  const handleUpdateCompanyImage = (e, type, trigger) => {
    const { files } = e.target;
    const selectedFile = files[0];

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
    setSelectedCompanyLogo(selectedFile);

    dispatch(actions.updateCompanyImage({ id, files, type })).then(() => {
      trigger(['company-logo']);
    });
  };

  const handleDeleteImage = (trigger, type) => {
    dispatch(actions.removeCompanyImage({ id, companyLogo, type })).then(() => {
      setCompanyLogo('');
      trigger(['company-logo']);
    });
  };

  const handleSubmit = (dataS) => {
    handleUpdate(dataS);
    setTabSelected(page + 1);
  };

  const isUK = country && country.code === 'UK';

  return (
    <ClinkForm
      disableUntilValid
      defaultValues={data}
      method="POST"
      onSubmit={handleSubmit}
      render={(formHook) => {
        const { formState, register, setValue, trigger, control, getValues } =
          formHook;
        const { errors, isValid } = formState;
        const disabledSubmit = !isValid;

        return (
          <Box
            sx={{
              '& input': {
                borderRadius: '5px!important',
                '&[type="text"]:read-only': { backgroundColor: platinum },
              },
            }}
          >
            <Box
              sx={{
                width: '100%',
                height: '100%',
                mt: 4,
                '& input[name="company-logo"]': {
                  display: companyLogo ? 'none' : 'block',
                },
              }}
            >
              <MuiCompanyTitle title={data.name} anthem={data.reg_number} />
              {companyLogoLoading && (
                <Loading status="Loading company logo..." />
              )}
              <MuiSubtitle>{t('profile-company-logo')}</MuiSubtitle>

              {!companyLogoLoading && (
                <ImageDropzone
                  theme="prosper-preq-v2"
                  name="company-logo"
                  maxSize={companyMaxSize}
                  acceptedTypes={acceptedTypes}
                  existingImageUrl={companyLogo}
                  onFileSelect={(e) =>
                    handleUpdateCompanyImage(e, 'company', trigger)
                  }
                  onDelete={() => handleDeleteImage(trigger, 'company')}
                  register={register}
                  errors={errors}
                  fileErrorMessage={companyLogoVerify}
                  hideDropzoneIfPreview
                  className="company-logo-input"
                />
              )}
            </Box>

            <ProsperCompanyPage
              data={data}
              register={register}
              errors={errors}
              setValue={setValue}
              getValues={getValues}
              checked={operatingAddressChecked}
              changeChecked={setOperatingAddressChecked}
              trigger={trigger}
              control={control}
              manualMode
              isUK={isUK}
            />

            <MuiSubmitWrapper>
              <Button
                color="primary"
                variant="contained"
                size="large"
                onClick={() => {
                  setTabSelected(page - 1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                {t('previous-step')}
              </Button>
              {/* TODO: Remove sx when removing MuiSubmitWrapper */}
              <Button
                sx={{ ml: 2 }}
                color="success"
                variant="contained"
                size="large"
                type="submit"
                disabled={disabledSubmit}
              >
                {t('save-continue')}
              </Button>
            </MuiSubmitWrapper>
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

export default connect(mapStateToProps)(CompanyDetails);
