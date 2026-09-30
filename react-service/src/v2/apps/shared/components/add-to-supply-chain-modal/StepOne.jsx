import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { InputText } from 'clink-components';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useContext } from 'v2/hooks/context';
import { useSnackbar } from 'v2/hooks/useSnackbar';
/**
 * Step 1: Basic Company Details
 * Captures company name and registration number
 */
const StepOne = ({ onNext, onCancel, initialData = {}, account, dispatch }) => {
  const { t } = useTranslation();
  const [companyName, setCompanyName] = useState(initialData.companyName || '');
  const [companyReg, setCompanyReg] = useState(initialData.companyReg || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const context = useContext();
  const { actions } = context;
  const { showSnackbar } = useSnackbar();
  const BoxStyles = {
    marginBottom: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    flex: 1,
    width: '300px'
  }

  const handleNext = async () => {
    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call API to check if company exists in supply chain
      const response = await dispatch(
        actions.checkCompany({
          accountId: account?.id,
          companyName: companyName.trim(),
        })
      );
      const apiData = response.payload || {};

      // Check if company is already in supply chain
      if(apiData?.message){
        setError(apiData?.message);
        showSnackbar(apiData?.message, 'error');
        setLoading(false);
        return;
      }

      // Pass data to next step
      onNext({
        companyName: companyName.trim(),
        companyReg: companyReg.trim(),
        existingRecord: apiData.data || null,
      });
    } catch (err) {
      setError('An error occurred while looking up the company. Please try again.');
      console.error('Company lookup error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography
        sx={{
          color: '#666',
          marginBottom: '1.5rem',
          fontSize: '0.95rem',
        }}
      >
        {t('add-to-supply-chain-step1-title')}
      </Typography>

      <Box

        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
        <Box sx={BoxStyles}>
          <InputText
            label="Company name*"
            name="company_name"
            type="text"
            inputValue={companyName}
            onChange={(e) => {
              setCompanyName(e.target.value);
              if (error) setError('');
            }}
            hasError={!!error}
            required
          />
        </Box>

        <Box sx={BoxStyles}>
          <InputText
            label="Company reg"
            name="company_reg"
            type="text"
            inputValue={companyReg}
            onChange={(e) => {
              setCompanyReg(e.target.value);
              if (error) setError('');
            }}
          />
        </Box>
      </Box>

      {error && (
        <Box sx={{ marginBottom: '1rem' }}>
          <Typography sx={{ color: '#d32f2f', fontSize: '0.875rem' }}>
            {error}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'end',
          gap: '1rem',
          marginTop: '2rem',
        }}
      >

        <Button
          id="btn-go-back"
          variant="outlined"
          onClick={onCancel}
          disabled={loading}
          sx={{
            borderRadius: '6px',
            fontWeight: 600,
            borderColor: '#d8d0d0',
            color: '#4d4d4d',
            padding: '5px 20px',
          }}
          >
            {t('go-back')}
        </Button>

        <Button
          id="btn-use-company"
          sx={{
            borderRadius: '6px',
            fontWeight: 600,
            padding: '5px 20px',
            backgroundColor: companyName.trim()?.length ? '#00BBA7' : '#7FDDD3',
            color: '#fff !important'
          }}
          onClick={handleNext}
          disabled={!companyName.trim()?.length}
        >
          {loading ? 'checking' : t('use-this-company')}
        </Button>
      </Box>
    </Box>
  );
};

StepOne.propTypes = {
  onNext: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  account: PropTypes.object,
  dispatch: PropTypes.func,
  actions: PropTypes.object,
};

export default StepOne;
