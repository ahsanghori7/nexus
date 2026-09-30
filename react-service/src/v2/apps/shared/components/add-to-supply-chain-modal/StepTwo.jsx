import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { InputText, InputEmail } from 'clink-components';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import AutocompleteMui from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import { useDispatch, useSelector } from 'react-redux';
import { useContext } from 'v2/hooks/context';
import { useSnackbar } from 'v2/hooks/useSnackbar';

/**
 * Step 2: Complete Subcontractor Details
 * Captures all required information for the subcontractor
 */
const StepTwo = ({ onBack, onCancel, formData = {}, account }) => {
  const { t } = useTranslation();
  const {actions} = useContext()
  const dispatch = useDispatch()
  const {trades,regions} = useSelector(state => state.attributes)
  const { showSnackbar } = useSnackbar();
  const existingRecord = formData.existingRecord;

  // Form state
  const [companyName, setCompanyName] = useState(existingRecord?.name || formData.companyName || '');
  const [companyReg, setCompanyReg] = useState(existingRecord?.number || formData.companyReg || '');
  const [firstName, setFirstName] = useState(existingRecord?.user?.firstname || '');
  const [lastName, setLastName] = useState(existingRecord?.user?.lastname || '');
  const [email, setEmail] = useState(existingRecord?.user?.email|| '');
  const [phone, setPhone] = useState(existingRecord?.mobile || '');
  const [address, setAddress] = useState(existingRecord?.address || '');
  const [selectedTrades, setSelectedTrades] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedTradesIds, setSelectedTradesIds] = useState([]);
  const [selectedLocationsIds, setSelectedLocationsIds] = useState([]);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(()=>{
    dispatch(actions.fetchAttrRegions());
    dispatch(actions.fetchAttrTrades(1));
  },[])

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Check if form is valid (for button enable/disable)
  const isFormValid = () => {
    return (
      companyName.trim().length > 0 &&
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      email.trim().length > 0 &&
      emailRegex.test(email) &&
      address.trim().length > 0 &&
      selectedTradesIds.length > 0 &&
      selectedLocationsIds.length > 0
    );
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!address.trim()) newErrors.address = 'Address is required';
    if (!selectedTradesIds.length) newErrors.trades = 'Please assign at least one trade';
    if (!selectedLocationsIds.length) newErrors.locations = 'Please select at least one location';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    setApiError('');

    const data = {
      company_name: companyName.trim(),
      reg_number: companyReg.trim(),
      firstname: firstName.trim(),
      lastname: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      trades: selectedTradesIds,
      locations: selectedLocationsIds,
    }

    try {
      setLoading(true);
      // Call API to add subcontractor to supply chain
      const response = await dispatch(
        actions.addToSupplyChain({
          accountId: account?.id,
          data,
        })
      );

      // Check if the API call was successful
      if (response?.payload?.status === 200) {
        showSnackbar('Subcontractor added to the Supply Chain successfully', 'success');
        onCancel();
      } else {

        let errorMessage = 'Failed to add subcontractor. Please try again.';

        // Safely attempt to extract JSON error message
        try {
          const errorBody = await response?.payload?.json();
          errorMessage = errorBody?.message || response?.payload?.statusText || errorMessage;
        } catch {
          // JSON parsing failed – fall back to statusText or default
          errorMessage = response?.payload?.statusText || errorMessage;
        }

        showSnackbar(errorMessage, 'error');
        setApiError(errorMessage);
      }
    } catch (err) {
      // Error occurred, keep modal open and show error
      setApiError(err.message || 'Failed to add subcontractor. Please try again.');
    } finally {
      setLoading(false);
    }


  };

  const BoxStyles = {
    marginBottom: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    flex: 1,
    width: '300px'
  }

  return (
    <Box sx={{
      overflowX:'hidden',
      overflowY:'auto',
      maxHeight:'500px',
      paddingRight: '10px',
    }}>
      <Typography
        sx={{
          color: '#666',
          marginBottom: '1.5rem',
          fontSize: '0.95rem',
        }}
      >
        {t('add-to-supply-chain-step2-subtitle')}
      </Typography>

      {/* Company Details Section */}
      <Box sx={{ marginBottom: '1.5rem' }}>
        <Box sx={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <Box sx={BoxStyles}>
            <InputText
              label="Company name*"
              name="company_name"
              type="text"
              inputValue={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                if (errors.companyName) {
                  setErrors({ ...errors, companyName: null });
                }
              }}
              hasError={!!errors.companyName}
              required
            />
            {errors.companyName && (
              <Typography sx={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.companyName}
              </Typography>
            )}
          </Box>

          <Box sx={BoxStyles}>
            <InputText
              label="Company registration number"
              name="company_registration_number"
              type="text"
              inputValue={companyReg}
              onChange={(e) => {
                setCompanyReg(e.target.value);
                if (errors.companyReg) {
                  setErrors({ ...errors, companyReg: null });
                }
              }}
              hasError={!!errors.companyReg}
            />
            {errors.companyReg && (
              <Typography sx={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.companyReg}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Contact Details Section */}
      <Box sx={{ marginBottom: '1.5rem' }}>
        <Box sx={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <Box sx={BoxStyles}>
            <InputText
              label="First name*"
              name="first_name"
              type="text"
              inputValue={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (errors.firstName) {
                  setErrors({ ...errors, firstName: null });
                }
              }}
              hasError={!!errors.firstName}
              required
            />
            {errors.firstName && (
              <Typography sx={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.firstName}
              </Typography>
            )}
          </Box>

          <Box sx={BoxStyles}>
            <InputText
              label="Last name*"
              name="last_name"
              type="text"
              inputValue={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                if (errors.lastName) {
                  setErrors({ ...errors, lastName: null });
                }
              }}
              hasError={!!errors.lastName}
              required
            />
            {errors.lastName && (
              <Typography sx={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.lastName}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={{...BoxStyles,width:'100%'}}>
          <InputEmail
            label="Email Address*"
            name="email"
            type="email"
            defaultValue={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) {
                setErrors({ ...errors, email: null });
              }
            }}
            hasError={!!errors.email}
            required
          />
          {errors.email && (
            <Typography sx={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {errors.email}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <Box sx={BoxStyles}>
            <InputText
              label="Phone number"
              name="phone"
              type="tel"
              inputValue={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Box>
          <Box sx={BoxStyles}>
            <InputText
              label="Address*"
              name="address"
              type="text"
              inputValue={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (errors.address) {
                  setErrors({ ...errors, address: null });
                }
              }}
              hasError={!!errors.address}
              required
            />
            {errors.address && (
              <Typography sx={{ color: '#d32f2f', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.address}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Other Details Section */}
      <Box sx={{ marginBottom: '1.5rem' }} display="flex" gap={2}>
        <Box sx={{ marginBottom: '1rem' }} flex={1}>
          <AutocompleteMui
            multiple
            limitTags={1}
            filterSelectedOptions
            id="assign-trades"
            value={selectedTrades}
            options={trades}
            getOptionLabel={(option) => option.label || option.name || ''}
            onChange={(event, newValue) => {
              setSelectedTrades(newValue);
              setSelectedTradesIds(newValue.map((v) => Number(v.id)));
              if (errors.trades) {
                setErrors({ ...errors, trades: null });
              }
            }}
            sx={{
              '& .MuiAutocomplete-tag': {
                backgroundColor: 'transparent !important',
                border: '1px solid #e0e0e0 !important',
                color: '#8e8dbe !important',
              }
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id}
                  label={option.label || option.name}
                  sx={{
                    backgroundColor: 'transparent !important',
                    border: '1px solid #e0e0e0 !important',
                    color: '#8e8dbe !important',
                  }}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Assign trades *"
                placeholder="Select trade"
                error={!!errors.trades}
                helperText={errors.trades}
              />
            )}
          />
        </Box>

        <Box sx={{ marginBottom: '1rem' }} flex={1}>
          <AutocompleteMui
            multiple
            limitTags={1}
            filterSelectedOptions
            id="locations"
            value={selectedLocations}
            options={regions}
            getOptionLabel={(option) => option.label || option.name || ''}
            onChange={(event, newValue) => {
              setSelectedLocations(newValue);
              setSelectedLocationsIds(newValue.map((v) => Number(v.id)));
              if (errors.locations) {
                setErrors({ ...errors, locations: null });
              }
            }}
            sx={{
              '& .MuiAutocomplete-tag': {
                backgroundColor: 'transparent !important',
                border: '1px solid #e0e0e0 !important',
                color: '#8e8dbe !important',
              }
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id}
                  label={option.label || option.name}
                  sx={{
                    backgroundColor: 'transparent !important',
                    border: '1px solid #e0e0e0 !important',
                    color: '#8e8dbe !important',
                  }}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Locations *"
                placeholder="Select location"
                error={!!errors.locations}
                helperText={errors.locations}
              />
            )}
          />
        </Box>
      </Box>

      {apiError && (
        <Box sx={{ marginBottom: '1rem' }}>
          <Typography sx={{ color: '#d32f2f', fontSize: '0.875rem' }}>
            {apiError}
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
          id="btn-back"
          variant="outlined"
          onClick={onBack}
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
          id="btn-add"
          variant="contained"
          onClick={handleSubmit}
          disabled={!isFormValid() || loading}
          sx={{
            borderRadius: '6px',
            fontWeight: 600,
            padding: '5px 20px',
            backgroundColor: isFormValid() ? '#00BBA7' : '#7FDDD3',
            color: '#fff !important'
          }}
        >
          {loading ? 'Adding...' : 'Add'}
        </Button>
      </Box>
    </Box>
  );
};

StepTwo.propTypes = {
  onBack: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  formData: PropTypes.object,
  account: PropTypes.object,
  trades: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      label: PropTypes.string,
    })
  ),
  locations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      label: PropTypes.string,
    })
  ),
};

StepTwo.defaultProps = {
  trades: [],
  locations: [],
};

export default StepTwo;
