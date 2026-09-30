import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid2';
import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import { CONSTANTS } from 'clink-components';
import Wrapper from 'v2/apps/prosper/pages/sign-up/shared/Wrapper';
import Autocomplete from 'v2/apps/shared/components/select/Autocomplete';
import { checkValid } from 'v2/helpers/async';
import { getAddress } from 'v2/helpers/data';
import Title from 'v2/apps/prosper/pages/sign-up/shared/Title';
import InputText from 'v2/apps/prosper/pages/sign-up/shared/InputText';
import Checkbox from 'v2/apps/prosper/pages/sign-up/shared/Checkbox';
import Container from 'v2/apps/prosper/pages/sign-up/shared/Container';
import Adornment from 'v2/apps/prosper/pages/sign-up/shared/Adornment';
import { handleChange } from 'v2/apps/prosper/pages/sign-up/validation';
import { httpHelperV2 as httpHelperService } from 'v2/services/httpHelper';

const { white } = CONSTANTS.colors.general;

function checkCompanyExists(region = 0, search = {}) {
  const keys = Object.keys(search);
  const values = Object.values(search);
  let url = `companies/company_exists/${region}`;
  keys.forEach((key, index) => {
    if (!index) {
      url += '?';
    } else {
      url += '&';
    }
    url += `${key}=${values[index]}`;
  });
  return httpHelperService({ url });
}

function Form({ styles, codeRegion }) {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(true);
  const [companyAlreadyExistsError, setCompanyAlreadyExistsError] =
    useState(false);
  const [companyRegAlreadyExistsError, setCompanyRegAlreadyExistsError] =
    useState(false);
  const [company, setCompany] = useState(null);
  const [companyReg, setCompanyReg] = useState(null);
  const [password, setPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [mailing, setMailing] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!codeRegion) {
      navigate('/sign-up');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckChange = (checked, setChecked) => setChecked(!checked);

  const disableSubmit =
    (passwordErrors.length ||
      !email ||
      !firstname ||
      !lastname ||
      !password ||
      !terms ||
      !privacy ||
      emailError ||
      !company ||
      !companyReg ||
      companyAlreadyExistsError ||
      companyRegAlreadyExistsError ||
      (company && company.has_account)) &&
    !submitted;

  const extra = {
    component: 'form',
    method: 'post',
    action: '/account/sign_up',
    encType: 'multipart/form-data',
  };

  const fetchCompanyAsset = async (
    inputValue,
    keyValue,
    setAlreadyExistsError,
    setError
  ) => {
    setLoading(true);
    return checkCompanyExists(codeRegion?.id, {
      [keyValue]: inputValue,
      strict: 1,
    })
      .then((res) => {
        if (res && 'data' in res) {
          const { data } = res;
          setError(data ? 'Company already exists' : false);
          setAlreadyExistsError(data);
          setLoading(false);
        } else {
          throw new Error('Api failed');
        }
      })
      .catch((error) => {
        setError(error);
        setAlreadyExistsError(false);
        setLoading(false);
      });
  };

  const handleInputChange = (setState, name, setStateError, error) =>
    debounce(async ([e], setError) => {
      const value = e?.target?.value || '';
      setState(value);
      if (value) {
        return fetchCompanyAsset(value, name, setStateError, setError);
      }
      setStateError(false);
      setError(error);
      return null;
    }, 500);

  const onCompanyNameInputChange = handleInputChange(
    setCompany,
    'name',
    setCompanyAlreadyExistsError,
    'Company name required'
  );
  const onCompanyRegInputChange = handleInputChange(
    setCompanyReg,
    'reg_number',
    setCompanyRegAlreadyExistsError,
    'Company registration number required'
  );

  return (
    <Container extra={extra} styles={styles}>
      <input
        type="hidden"
        name="registered_company_number"
        value={companyReg?.number || companyReg || ''}
      />
      <input
        type="hidden"
        name="company_address"
        value={(company?.address && getAddress(company.address)) || ''}
      />
      {Boolean(codeRegion?.id) && (
        <input type="hidden" name="region_group_id" value={codeRegion.id} />
      )}
      <Grid container flexDirection="column">
        <Title
          styles={{
            fontSize: styles.titleSize,
            whiteSpace: styles.noWrap,
          }}
          marginBottom={styles.mb}
          title={t('create-credentials')}
        />
        <Autocomplete
          sx={{ marginBottom: 3, backgroundColor: white }}
          disablePortal
          name="company_name"
          options={[]}
          label={t('profile-company-name')}
          placeholder={t('profile-company-name')}
          showOptions
          loading={loading}
          value={company}
          onInputChange={onCompanyNameInputChange}
        />
        <Autocomplete
          sx={{ marginBottom: 3, backgroundColor: white }}
          disablePortal
          name="company_reg_number"
          options={[]}
          label={t('profile-company-reg-number')}
          placeholder={t('profile-company-reg-number')}
          showOptions
          loading={loading}
          value={companyReg}
          onInputChange={onCompanyRegInputChange}
        />
        <InputText
          id="firstname"
          name="firstname"
          label={t('profile-firstname')}
          placeholder={t('profile-firstname')}
          type="text"
          styles={styles}
          handleChange={async (e, setError) => {
            setError(
              !e?.target?.value ? `${t('profile-firstname')} required` : false
            );
            setFirstname(e?.target?.value);
          }}
        />
        <InputText
          id="lastname"
          name="lastname"
          label={t('profile-lastname')}
          placeholder={t('profile-lastname')}
          type="text"
          styles={styles}
          handleChange={async (e, setError) => {
            setError(
              !e?.target?.value ? `${t('profile-lastname')} required` : false
            );
            setLastname(e?.target?.value);
          }}
        />
        <InputText
          id="email"
          name="email"
          label={t('email')}
          placeholder="main@main.com"
          type="email"
          styles={styles}
          handleChange={async (e, setError) =>
            checkValid(
              e?.target?.value,
              'company_email',
              (error) => {
                setError(error);
                setEmailError(error);
              },
              () => {
                setEmail(e?.target?.value);
                setEmailError(false);
              },
              null,
              /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            )
          }
        />
        <InputText
          id="password"
          name="password"
          label={t('sa-password')}
          placeholder="password"
          type="password"
          Adornment={Adornment}
          styles={{ ...styles, inputMb: 5 }}
          passwordErrors={passwordErrors}
          handleChange={(e, setError) =>
            handleChange(
              e,
              setError,
              t('sa-password'),
              setPasswordErrors,
              setPassword
            )
          }
        />
        <Checkbox
          label={
            <>
              <Typography variant="normal" fontSize={12} fontWeight={200}>
                {t('terms-and-conditions-1')}
              </Typography>
              <Link href={`${BASE_URLS.SITE_PROSPER}/terms-and-conditions/`}>
                <Typography variant="normal" fontSize={12} fontWeight={200}>
                  {t('terms-and-conditions-2')}
                </Typography>
              </Link>
            </>
          }
          name="terms_agree"
          checked={terms}
          handleClick={() => handleCheckChange(terms, setTerms)}
        />
        <Checkbox
          label={
            <>
              <Typography variant="normal" fontSize={12} fontWeight={200}>
                {t('Accept')}
              </Typography>
              <Link href={`${BASE_URLS.SITE_PROSPER}/privacy-policy/`}>
                <Typography variant="normal" fontSize={12} fontWeight={200}>
                  {t('sa-privacy-policy-2')}
                </Typography>
              </Link>
            </>
          }
          name="privacy_agree"
          checked={privacy}
          handleClick={() => handleCheckChange(privacy, setPrivacy)}
        />
        <Checkbox
          label={
            <Typography variant="normal" fontSize={12} fontWeight={200}>
              {t('add-mailing-list')}
            </Typography>
          }
          name="mailing_list_consent"
          checked={mailing}
          handleClick={() => handleCheckChange(mailing, setMailing)}
        />
        <Grid mt={styles.bottomMt}>
          <Button
            design="red"
            disabled={Boolean(disableSubmit)}
            type="submit"
            onClick={() => setSubmitted(true)}
          >
            {t('sign-up')}
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
}

const SignUpStep = (props) => {
  return <Wrapper Component={Form} {...props} />;
};

export default SignUpStep;
