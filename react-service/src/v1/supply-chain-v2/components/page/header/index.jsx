import React, { useState, useEffect } from 'react';
import debounce from 'lodash/debounce';
import i18next from 'v2/helpers/i18n';
import GlobalModal from 'v1/global/components/modal/v2';
import Alert from '@mui/material/Alert';
import FormSubcontractor from './form-subcontractor';
import FindSubcontractor from './find-subcontractor';

const checkMobile = () => window.innerWidth < 768;

const ButtonContent = () => {
  const [isMobile, setIsMobile] = useState(checkMobile());

  useEffect(() => {
    const handleResize = () => {
      if (checkMobile()) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    };

    window.addEventListener('resize', debounce(handleResize, 100));
    return () => {
      window.removeEventListener('resize', debounce(handleResize, 100));
    };
  }, []);

  return isMobile ? 'Add' : 'Add subcontractor';
};

const Form = ({
  page,
  regions,
  trades,
  subcontractorData,
  hasAccount,
  accountData,
  initialPage,
  setSubcontractorData,
  handleBackToFindSubcontractor,
  regNumber,
  companyName,
  subcontractorType,
  backBtnClicked,
  setBackBtnClicked,
  ...rest
}) => {
  if (!page) {
    return (
      <FindSubcontractor
        {...rest}
        regNumber={regNumber}
        companyName={companyName}
        subcontractorType={subcontractorType}
        backBtnClicked={backBtnClicked}
        setBackBtnClicked={setBackBtnClicked}
        onFoundData={setSubcontractorData}
        accountData={accountData}
      />
    );
  }

  return (
    <FormSubcontractor
      {...rest}
      regions={regions}
      trades={trades}
      formData={subcontractorData}
      onBack={handleBackToFindSubcontractor}
      hasAccountProp={hasAccount}
      accountData={accountData}
      edit={Boolean(initialPage)}
    />
  );
};

const SubcontractorModal = ({
  showButtonModal,
  formData,
  addData,
  editData,
  regions,
  trades,
  initialPage = 0,
  title = '',
  hasAccount = false,
  accountData = null,
  externalState = null,
}) => {
  const [page, setPage] = useState(initialPage);
  const [regNumber, setRegNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [subcontractorType, setSubcontractorType] = useState('uk');
  const [backBtnClicked, setBackBtnClicked] = useState(false);
  const [subcontractorData, setSubcontractorData] = useState(formData);
  let hasAccountData = hasAccount;
  if (subcontractorData) {
    hasAccountData = hasAccount || subcontractorData.has_account;
  }

  const existingSubcontractor = (hasAccount || hasAccountData) && page !== 0;

  // Function to handle resetting form data when modal closes
  const handleModalClose = () => {
    // Check existingSubcontractor before closing
    let currentHasAccountData = hasAccount;
    if (subcontractorData) {
      currentHasAccountData = hasAccount || subcontractorData?.has_account;
    }
    const isExistingSubcontractor = (hasAccount || currentHasAccountData) && page !== 0;

    if (isExistingSubcontractor) {
      // Reset to initial formData when existingSubcontractor is true
      setSubcontractorData(formData);
      setPage(initialPage);
      setRegNumber('');
      setCompanyName('');
      setSubcontractorType('uk');
      setBackBtnClicked(false);
    }
    // If isExistingSubcontractor is false, keep subcontractorData as is (preserve previous data)
  };

  const handleBackToFindSubcontractor = (reg, name, type = 'uk') => {
    setRegNumber(reg);
    setCompanyName(name);
    setSubcontractorType(type);
    setBackBtnClicked(true);
    setPage(0);
  };

  const subtitle = page
    ? 'Complete the remaining empty fields'
    : 'Enter Company name or registration number';
  return (
    <GlobalModal
      externalState={externalState}
      title={title}
      subtitle={subtitle}
      buttonContent={<ButtonContent />}
      className="find-subcontractor-modal"
      dialogClassName="find-subcontractor-modal-dialog"
      ShowButton={showButtonModal}
      showClose={false}
      onHide={handleModalClose}
      render={(props) => {
        const { setShow } = props;
        const closeModal = () => {
          handleModalClose();
          setShow(false);
        };
        const handleSubmit = page
          ? (data) => {
              closeModal();
              const newData = {
                ...data,
                hasAccount: hasAccount || hasAccountData,
                IsNonUkSubcontractor: subcontractorData?.is_non_uk || false,
              };
              if (initialPage) {
                editData(formData.id, newData);
              } else {
                addData(newData);
              }
              setPage(initialPage);
            }
          : () => {
              setPage(1);
              setBackBtnClicked(false);
            };
        const backPage = formData ? closeModal : () => setPage(0);
        return (
          <>
            {existingSubcontractor && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                {i18next.t('sc-existing-sub')}
              </Alert>
            )}
            <Form
              regNumber={regNumber}
              companyName={companyName}
              subcontractorType={subcontractorType}
              backBtnClicked={backBtnClicked}
              setBackBtnClicked={setBackBtnClicked}
              closeModal={closeModal}
              onSubmit={handleSubmit}
              backPage={backPage}
              page={page}
              regions={regions}
              trades={trades}
              subcontractorData={subcontractorData}
              setSubcontractorData={setSubcontractorData}
              hasAccount={hasAccountData}
              accountData={accountData}
              initialPage={initialPage}
              handleBackToFindSubcontractor={handleBackToFindSubcontractor}
            />
          </>
        );
      }}
    />
  );
};

export { SubcontractorModal, FormSubcontractor, FindSubcontractor };
