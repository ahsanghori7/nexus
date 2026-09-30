import React, { useEffect } from 'react';
import { CONSTANTS, Image } from 'clink-components';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import MuiDialog from 'v2/apps/shared/components/dialog';
import Grid from '@mui/material/Grid';
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';
import { b64EncodeUnicode, UnicodeDecodeB64 } from 'v2/helpers/data';
import { subdomain } from 'v2/apps/widgets/opportunity-viewer/config';
import Autocomplete from './Autocomplete';
import Placeholder from './Placeholder';

const { blackCarretDown } = CONSTANTS.s3;
const { prosperBoxRed } = CONSTANTS.colors.prosper;

function getInitial(hasCookie, name) {
  let val = [];
  const lastCookie = Cookies.get(hasCookie, subdomain);
  if (hasCookie && name && lastCookie) {
    const decode = JSON.parse(UnicodeDecodeB64(lastCookie));
    val = decode[name] || [];
  }
  return val;
}

function checkOption(option, newValue) {
  if (!option || !newValue) {
    return false;
  }
  return Boolean(
    option.filter(
      (optListItem) => Number(optListItem.id) === Number(newValue.id),
    ).length,
  );
}

const IconComponent = () => (
  <span style={{ paddingRight: '15px' }}>
    {' '}
    <Image src={blackCarretDown} width={15} />
  </span>
);

export default function SelectDialog({
  myRef = null,
  options = [],
  title = null,
  placeholder = null,
  setter = () => null,
  hasCookie = false,
  name = false,
  initialOption = {},
  defaultValues = [],
  updateValues = () => null,
  disableSearch = false,
  activeSelectAll = false,
  searchCallback = null,
  showAllText = true,
  onCloseCallback = () => null,
  context = BASE_DIRS.V2.PROSPER,
  uncheck = false,
  uncheckAction = () => null,
  emptyStateMessage = null,
}) {
  const values = defaultValues.length
    ? defaultValues
    : getInitial(hasCookie, name);

  const [open, setOpen] = React.useState(false);
  const [option, setOption] = React.useState(values);
  const [allOptions, setAllOptions] = React.useState(options);
  const [allSelected, setAllSelected] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const { t } = useTranslation();

  useEffect(() => {
    if (options) {
      setAllOptions(options);
    }
  }, [options]);

  useEffect(() => {
    if (option && option.length) {
      setter(option);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (defaultValues && defaultValues.length) {
      setOption(defaultValues);
    }
  }, [defaultValues]);

  useEffect(() => {
    setAllSelected(
      Boolean(option && option.length && option.length === options.length),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [option]);

  useEffect(() => {
    if (open) {
      setAllSelected(
        Boolean(option && option.length && option.length === options.length),
      );
    } else if (onCloseCallback) {
      onCloseCallback();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleChange = (event) => {
    const { target } = event;
    const { value } = target;
    const [newValues] = options.filter((opt) => opt.label === value);
    let result = [...option, newValues];
    if (checkOption(option, newValues)) {
      result = option.filter((pn) => pn.label !== newValues.label);
    }
    if (uncheck) {
      uncheckAction(newValues);
    } else {
      setOption(result);
    }
    if (!uncheck && hasCookie && name) {
      const lastCookie = Cookies.get(hasCookie, subdomain);
      if (!lastCookie) {
        const jsonString = JSON.stringify({ [name]: result });
        Cookies.set(hasCookie, b64EncodeUnicode(jsonString), subdomain);
      } else {
        const decode = JSON.parse(UnicodeDecodeB64(lastCookie));
        decode[name] = result;
        const jsonString = JSON.stringify(decode);
        Cookies.set(hasCookie, b64EncodeUnicode(jsonString), subdomain);
      }
    }
  };
  const handleClickOpen = () => {
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setAllOptions([...options]);
    setSearchTerm('');
  };
  const handleClose = (event, reason) => {
    if (reason !== 'backdropClick') {
      closeModal();
    }
  };

  const buttonSx = uncheck ? { display: 'none' } : {};
  return (
    <>
      <Button
        ref={myRef}
        data-testid={`${name}-open-modal`}
        onClick={handleClickOpen}
        sx={buttonSx}
        fullWidth
      >
        <Select
          fullWidth
          labelId="multiple-checkbox-label"
          id="multiple-checkbox"
          multiple
          displayEmpty
          value={option}
          disabled
          sx={{
            height: 48,
            color: 'red',
            '& > div': {
              paddingRight: '10px !important',
            },
          }}
          IconComponent={IconComponent}
          input={<OutlinedInput label="Tag" />}
          renderValue={(selected) => (
            <Grid container>
              <Grid item xs={8}>
                <Placeholder left title={title} />
              </Grid>
              {selected && Boolean(selected.length) && (
                <Grid item xs={4}>
                  <Placeholder right>
                    <b>
                      {selected.length === options.length && showAllText
                        ? t('all')
                        : selected.length}
                    </b>
                  </Placeholder>
                </Grid>
              )}
            </Grid>
          )}
        />
      </Button>
      <MuiDialog
        title={title}
        open={open}
        handleClose={handleClose}
        handleXClose={() => {
          closeModal();
          if (initialOption && initialOption[name]) {
            setter(initialOption[name]);
            setOption(initialOption[name]);
          }
          if (initialOption && initialOption.lastCookie) {
            Cookies.set(hasCookie, initialOption.lastCookie, subdomain);
          }
          if (defaultValues && defaultValues.length) {
            setOption(values);
          }
        }}
        preContent={
          <>
            {!disableSearch && (
              <Autocomplete
                sx={{ margin: '0 20px' }}
                disablePortal
                freeSolo
                id="autocomplete"
                options={options}
                // eslint-disable-next-line no-unused-vars
                onInputChange={([_, result]) => {
                  setSearchTerm(result || '');
                  if (searchCallback) {
                    searchCallback(result.toLowerCase());
                  } else {
                    let newAllOptions = [...options];
                    if (result) {
                      newAllOptions = options.filter((opt) =>
                        opt.label.toLowerCase().includes(result.toLowerCase()),
                      );
                    }
                    setAllOptions(newAllOptions);
                  }
                }}
                placeholder={placeholder}
              />
            )}
            {activeSelectAll && (
              <FormControlLabel
                sx={{
                  width: '100%',
                  marginRight: 0,
                  display: 'flex',
                  flexDirection: 'row-reverse',
                  justifyContent: 'space-between',
                  boxSizing: 'border-box',
                  paddingLeft: '34px',
                  paddingRight: '14px',
                  fontWeight: '300',
                }}
                control={
                  <Checkbox
                    checked={allSelected}
                    onChange={() => {
                      if (allSelected) {
                        setOption([]);
                      } else {
                        setOption(allOptions);
                      }
                    }}
                  />
                }
                value="Select all"
                label={
                  <Typography sx={{ color: prosperBoxRed }} variant="normal">
                    Select all
                  </Typography>
                }
              />
            )}
          </>
        }
        actions={
          !uncheck && (
            <>
              <Button
                color="secondary"
                variant="outlined"
                size="large"
                onClick={() => {
                  setOption([]);
                  setter([]);
                  if (hasCookie) {
                    Cookies.remove(hasCookie, subdomain);
                  }
                }}
              >
                {t('reset-filters')}
              </Button>
              <Button
                color="secondary"
                variant="contained"
                size="large"
                onClick={() => {
                  closeModal();
                  setter(option);
                  updateValues(option);
                }}
              >
                {t('apply')}
              </Button>
            </>
          )
        }
        context={context}
      >
        <Box component="form" sx={{ display: 'flex', flexWrap: 'wrap' }}>
          <FormGroup sx={{ width: '100%' }} data-testid="checkbox-options">
            {allOptions.length ? (
              allOptions.map((opt, index) => (
                <FormControlLabel
                  dialogselect="true"
                  key={opt.label}
                  control={
                    <Checkbox
                      data-testid={`checkbox-option-${index}`}
                      onChange={handleChange}
                      checked={checkOption(option, opt)}
                    />
                  }
                  value={opt.label}
                  label={<Typography variant="normal">{opt.label}</Typography>}
                  disabled={uncheck && checkOption(option, opt)}
                />
              ))
            ) : (
              <Box sx={{ px: 3, py: 2 }}>
                <Typography variant="normal" sx={{ opacity: 0.8 }}>
                  {emptyStateMessage ||
                    (searchTerm
                      ? `No results found for “${searchTerm}”.`
                      : 'No options available.')}
                </Typography>
              </Box>
            )}
          </FormGroup>
        </Box>
      </MuiDialog>
    </>
  );
}
