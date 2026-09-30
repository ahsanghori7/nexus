import React, { useEffect ,useState, useRef} from 'react';
import isString from 'lodash/isString';
import Button from 'react-bootstrap/Button';
import i18next from 'v2/helpers/i18n';
import { Searchbox } from 'clink-components';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import hooks from './hooks';
import MemoizedSubmit from './MemoizedSubmit';
import FieldHolder from 'v1/global/components/clink-form/FieldHolder';
import Loading from 'v1/global/components/Loading';
import FieldLabel from 'v1/global/components/clink-form/FieldLabel';
import SupplyChainHelper from '../../../../helpers';
import SupplyChainService from '../../../../services';
import setNameErrorMessage from './hooks/errorHelper';

const CloseButton = ({ closeModal }) => (
  <Button type="buton" onClick={closeModal} variant="outline-danger">
    Go Back
  </Button>
);

const FindSubcontractor = ({
  onSubmit,
  closeModal,
  onFoundData,
  accountData,
  regNumber,
  companyName,
  subcontractorType: initialSubcontractorType,
  backBtnClicked,
  setBackBtnClicked,
}) => {
  const [subcontractorType, setSubcontractorType] = useState(initialSubcontractorType || 'uk');
  const [nonUkCompanyName, setNonUkCompanyName] = useState('');
  const [nonUkCompanyReg, setNonUkCompanyReg] = useState('');
  const [nonUkNameError, setNonUkNameError] = useState('');
  const [nonUkRegError, setNonUkRegError] = useState('');
  const [nonUkValidating, setNonUkValidating] = useState(false);

  const service = useRef(new SupplyChainService()).current;

  const {
    loading,
    nameSearch,
    setNameSearch,
    setNameFocused,
    nameError,
    regSearch,
    setRegSearch,
    setRegFocused,
    regError,
    localFormData,
    handleClickOption,
    isDisabled,
    customNameError,
    customRegError,
    newNameOptions,
    setNameError,
    setRegError,
    initialRenderReg,
  } = hooks(accountData);

  let companyNamePlaceholder = i18next.t('type-search');
  let companyReg = i18next.t('type-search');

  if (
    accountData?.country?.code?.includes('NZ') ||
    accountData?.country?.code?.includes('AUS')
  ) {
    companyNamePlaceholder = i18next.t('type-search-name');
    companyReg = i18next.t('type-search-reg');
  }

  const handleSetNameSearch = (event) => {
    setNameSearch(event.target.value);
    setNameError('');
  };
  const handleSetRegSearch = (event) => {
    setRegSearch(event.target.value);
    setRegError('');
  };
  const handleSetNameFocus = () => setNameFocused(true);
  const handleSetNameBlur = () => setNameFocused(false);
  const handleSetRegFocus = () => setRegFocused(true);
  const handleSetRegBlur = () => setRegFocused(false);

  // Determine if submit button should be disabled
  const isSubmitDisabled = subcontractorType === 'uk'
    ? isDisabled
    : !nonUkCompanyName.trim() || nonUkValidating;

  const goBackHandler = () => {
    setBackBtnClicked(false);
    closeModal();
  };

  const validateNonUkCompany = async () => {
    setNonUkValidating(true);
    setNonUkNameError('');
    setNonUkRegError('');

    try {
      // Validate company name
      const nameResult = await service.searchByName({name:nonUkCompanyName?.trim() , subcontractorType: 'non-uk'});
      const companyObj = nameResult?.companies?.length > 0 && nameResult?.companies?.find((company) => {
        return company?.name?.trim() === nonUkCompanyName?.trim();
      });

      if (companyObj && companyObj?.in_supply_chain) {
        setNonUkNameError('in_supply_chain');
        setNonUkValidating(false);
        return { isValid: false, data: null };
      }

      setNonUkValidating(false);
      return { isValid: true, data: companyObj ? {...companyObj} : {} };

    } catch (error) {
      setNonUkValidating(false);
      setNonUkNameError('error');
      return { isValid: false, data: null };
    }
  };

  const handleSubmit = async () => {
    if (subcontractorType === 'non-uk') {
      // Validate non-UK company before proceeding
      const validationResult = await validateNonUkCompany();

      if (!validationResult.isValid) {
        // Validation failed, errors are already set
        return;
      }

      const validatedData = validationResult.data;

      // Validation passed, proceed with submission
      onSubmit();
      onFoundData({
        ...validatedData,
        company_name: validatedData?.name ? validatedData.name : nonUkCompanyName,
        reg_number: validatedData?.number ? validatedData.number : nonUkCompanyReg,
        address:validatedData?.address && isString(validatedData?.address) ? validatedData?.address : SupplyChainHelper.getFullAddress(validatedData?.address),
        firstname: validatedData?.has_account ? validatedData?.contact_name || '' : '',
        is_non_uk: true,
      });
    } else {
      // Handle UK subcontractor submission
      onSubmit();
      const {
        address = {},
        contact_name: contactName = '',
        email = '',
        phone = '',
        has_account: hasAccount,
      } = localFormData;
      onFoundData({
        ...localFormData,
        company_name: localFormData.name || localFormData.company_name,
        reg_number: regSearch,
        address:
          address && isString(address)
            ? address
            : SupplyChainHelper.getFullAddress(address),
        contact_name: hasAccount ? contactName : '',
        firstname: hasAccount ? contactName : '',
        email: hasAccount ? email : '',
        phone: hasAccount ? phone : '',
        is_non_uk: false,
      });
    }
  };

  useEffect(() => {
    if (backBtnClicked) {
      // Restore subcontractor type when coming back
      if (initialSubcontractorType) {
        setSubcontractorType(initialSubcontractorType);

        // For non-UK subcontractors, populate non-UK fields
        if (initialSubcontractorType === 'non-uk') {
          if (companyName) {
            setNonUkCompanyName(companyName);
          }
          if (regNumber) {
            setNonUkCompanyReg(regNumber);
          }
        } else {
          // For UK subcontractors, populate UK fields
          if (initialRenderReg) {
            initialRenderReg.current = false;
          }
          if (regNumber) {
            setRegFocused(true);
            setRegSearch(regNumber);
          }
          if (['NZ', 'AUS'].includes(accountData?.country?.code)) {
            setNameSearch(companyName);
          }
        }
      } else if (regNumber) {
        // Default behavior for UK when no type specified
        if (initialRenderReg) {
          initialRenderReg.current = false;
        }
        setRegFocused(true);
        setRegSearch(regNumber);
        if (['NZ', 'AUS'].includes(accountData?.country?.code)) {
          setNameSearch(companyName);
        }
      }
    }

    return () => {
      setBackBtnClicked(false);
      if (initialRenderReg) {
        initialRenderReg.current = true;
      }
      setRegFocused(false);
      setRegSearch('');
      setNameSearch('');
      setNonUkCompanyName('');
      setNonUkCompanyReg('');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {(loading || nonUkValidating) && <Loading />}
      <div className="clink-form find-subcontractor" >
        <div style={{width: '100%'}}>
          <div>
            <FieldHolder>
              <FieldLabel
                name="subcontractor-type"
                label="Subcontractor Type"
              />
              <RadioGroup
                row
                name="subcontractor-type"
                value={subcontractorType}
                onChange={(e) => setSubcontractorType(e.target.value)}
              >
                <FormControlLabel
                  value="uk"
                  control={<Radio />}
                  label="UK Subcontractor"
                />
                <FormControlLabel
                  value="non-uk"
                  control={<Radio />}
                  label="Non-UK Subcontractor"
                />
              </RadioGroup>
            </FieldHolder>
          </div>
          {subcontractorType === 'uk' && (
            <div className='uk-subcontractor-form-field'
              style={{ width: '100%' , display: 'flex'}}
            >
              <FieldHolder className={Boolean(nameError) && 'input-error'}>
                <FieldLabel
                  name="company-name"
                  label="Company name"
                  required
                  labelError
                  customErrors={customNameError}
                  triggerCustomErrors
                />
                <Searchbox
                  name="company-name"
                  className="company-name"
                  placeholder={companyNamePlaceholder}
                  options={newNameOptions}
                  value={nameSearch}
                  onClickOptions={handleClickOption}
                  handleChange={handleSetNameSearch}
                  handleFocus={handleSetNameFocus}
                  handleBlur={handleSetNameBlur}
                  disabled={loading}
                  async
                />
              </FieldHolder>
              <FieldHolder className={regError && 'searchbox-error'}>
                <FieldLabel
                  name="company-reg"
                  label="Company reg"
                  required
                  labelError
                  customErrors={customRegError}
                  triggerCustomErrors
                />
                <Searchbox
                  name="company-reg"
                  placeholder={companyReg}
                  value={regSearch}
                  handleChange={handleSetRegSearch}
                  handleFocus={handleSetRegFocus}
                  handleBlur={handleSetRegBlur}
                  disabled={loading}
                  async
                />
              </FieldHolder>
            </div>
          )}

        {subcontractorType === 'non-uk' && (
          <div className='non-uk-subcontractor-form-field' style={{display: 'flex'}}>
            <FieldHolder className={Boolean(nonUkNameError) && 'input-error'}>
              <FieldLabel
                name="non-uk-company-name"
                label="Company name"
                required
                labelError
                customErrors={nonUkNameError ? setNameErrorMessage('non-uk-company-name', nonUkNameError) : {}}
                triggerCustomErrors
              />
              <TextField
                fullWidth
                name="non-uk-company-name"
                placeholder="Enter company name"
                value={nonUkCompanyName}
                onChange={(e) => {
                  setNonUkCompanyName(e.target.value);
                  setNonUkNameError('');
                }}
                variant="outlined"
                size="small"
                error={Boolean(nonUkNameError)}
                disabled={nonUkValidating}
              />
            </FieldHolder>
            <FieldHolder className={Boolean(nonUkRegError) && 'input-error'}>
              <FieldLabel
                name="non-uk-company-reg"
                label="Company reg"
                labelError
                customErrors={nonUkRegError ? setNameErrorMessage('non-uk-company-reg', nonUkRegError) : {}}
                triggerCustomErrors
              />
              <TextField
                fullWidth
                name="non-uk-company-reg"
                placeholder="Enter registration number"
                value={nonUkCompanyReg}
                onChange={(e) => {
                  setNonUkCompanyReg(e.target.value);
                  setNonUkRegError('');
                }}
                variant="outlined"
                size="small"
                error={Boolean(nonUkRegError)}
                disabled={nonUkValidating}
              />
            </FieldHolder>
          </div>
        )}
        </div>

        <FieldHolder className="submit-button-holder">
          <MemoizedSubmit handleSubmit={handleSubmit} isDisabled={isSubmitDisabled} />
          <CloseButton closeModal={goBackHandler} />
        </FieldHolder>
      </div>
    </>
  );
};

export default FindSubcontractor;
