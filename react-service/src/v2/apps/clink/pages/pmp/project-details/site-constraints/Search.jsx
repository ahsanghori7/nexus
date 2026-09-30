import React, { useState, useMemo } from 'react';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Grid2 from '@mui/material/Grid2';
import { CONSTANTS } from 'clink-components';
import i18next from 'v2/helpers/i18n';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

const { lightPeriwinkle } = CONSTANTS.colors.general;

const Search = ({ useUpdateProject = {}, client = false }) => {
  const {
    useAddressOne: [addressOne, setAddressOne],
    useAddressTwo: [addressTwo, setAddressTwo],
    useCity: [city, setCity],
    usePostcode: [postcode, setPostcode],
    useErrorsOne: [errors],
  } = useUpdateProject;

  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const getAddressUrl = useMemo(
    () =>
      `${GET_ADDRESS.HOST}${postcode}?api-key=${GET_ADDRESS.API_KEY}&expand=true`,
    [postcode],
  );

  const handleOpen = () => {
    if (!postcode) return;
    setOpen(true);
    (async () => {
      setLoading(true);
      const result = await fetch(getAddressUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then((res) => res.json());
      setLoading(false);

      const newOptions = result?.addresses
        ? result.addresses.map((item, index) => ({
            ...item,
            id: index + 1,
            value: index + 1,
            postcode: result.postcode,
            label: [
              item?.line_1,
              item?.line_2,
              item?.town_or_city,
              result?.postcode,
            ]
              .filter(Boolean)
              .join(' , '),
          }))
        : [];
      setOptions(newOptions);
    })();
  };

  const handleClose = () => {
    setOpen(false);
    setOptions([]);
  };

  const fullAddress = [addressOne, addressTwo, city, postcode]
    .filter(Boolean)
    .join(', ');
  return (
    <Grid2
      size={{ xs: 12, md: 4 }}
      sx={{ width: '100% !important' }}
      container
      flexDirection="column"
    >
      <Grid2 borderBottom={`1px solid ${lightPeriwinkle}`} p={1.75}>
        <Typography sx={{ fontWeight: 600 }}>
          {i18next.t(client ? 'client-employer-information' : 'site-details')}
        </Typography>
      </Grid2>
      {errors.length > 0 && (
        <Grid2 p={1.75}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.map((error) => (
              <Typography key={error} variant="body2">
                {i18next.t(error)}
              </Typography>
            ))}
          </Alert>
        </Grid2>
      )}
      <Grid2 p={1.75} container spacing={2}>
        {client && (
          <>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <TextField
                slotProps={{
                  htmlInput: { 'data-testid': 'search-client-name-input' },
                }}
                label={i18next.t('references-client_name')}
                variant="outlined"
                fullWidth
                value={useUpdateProject.useClientName[0]}
                onChange={(e) =>
                  useUpdateProject.useClientName[1](e.target.value)
                }
              />
            </Grid2>
            <Grid2 size={{ xs: 12, md: 6 }}>
              <TextField
                slotProps={{
                  htmlInput: {
                    'data-testid': 'search-client-registration-number-input',
                  },
                }}
                label={i18next.t('client-registration-number')}
                variant="outlined"
                fullWidth
                value={useUpdateProject.useClientRegNumber[0]}
                onChange={(e) =>
                  useUpdateProject.useClientRegNumber[1](e.target.value)
                }
              />
            </Grid2>
          </>
        )}
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            slotProps={{
              htmlInput: { 'data-testid': 'search-postcode-input' },
            }}
            label={i18next.t(client ? 'client-postcode' : 'site-postcode')}
            variant="outlined"
            fullWidth
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            helperText={i18next.t('site-postcode-helper')}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <Autocomplete
            data-testid="search-address-autocomplete"
            sx={{ p: 0 }}
            open={open}
            onOpen={handleOpen}
            onClose={handleClose}
            isOptionEqualToValue={(option, value) =>
              option.label === value.label
            }
            getOptionLabel={(option) => option.label}
            options={options}
            loading={loading}
            onChange={(__, newValue) => {
              if (!newValue) {
                setAddressOne('');
                setAddressTwo('');
                setCity('');
                return;
              }
              setAddressOne(newValue.line_1);
              setAddressTwo(newValue.line_2);
              setCity(newValue.town_or_city);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                sx={{ p: 0 }}
                label={i18next.t(client ? 'client-address' : 'site-address')}
                helperText={fullAddress}
                slotProps={{
                  htmlInput: {
                    ...params.inputProps,
                    'data-testid': 'search-site-constrains-input',
                  },
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loading ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
            noOptionsText={i18next.t('no-addresses-found')}
          />
        </Grid2>
      </Grid2>
    </Grid2>
  );
};

export default Search;
