import React, { useEffect, useState } from 'react';
import InputAdornment from '@mui/material/InputAdornment';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { makeStyles } from '@mui/styles';
import { CONSTANTS, Form, InputFormControlled } from 'clink-components';
import parseCurrency, { currencyConfig } from 'v2/helpers/currency';
import i18next from 'v2/helpers/i18n';
import Div from './Div';
import Img from './Img';
import DeleteButton from './DeleteConfirmationModal';

const { clinkBlack } = CONSTANTS.colors.general;

const AttendanceCheckbox = ({
  uniqueKey,
  data,
  name,
  fullData,
  did,
  handleUpdateAttendance = () => null,
}) => {
  const [checked, setChecked] = useState(data[name]);

  useEffect(() => {
    setChecked(data[name]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data[name]]);

  return (
    <Checkbox
      type="checkbox"
      alt=""
      key={`${uniqueKey}-checkbox`}
      checked={checked}
      value={checked}
      name={name}
      onChange={(e) => {
        setChecked(e.target.checked);
        const content = [...fullData].map((i) =>
          Number(i.id) === Number(data.id) && i.description === data.description
            ? { ...i, [name]: e.target.checked }
            : i,
        );
        handleUpdateAttendance(did, content);
      }}
    />
  );
};

const AttendanceInput = ({
  data,
  did,
  fullData = [],
  field = 'description',
  handleUpdateAttendance = () => null,
}) => {
  const [value, setValue] = useState(data[field] ?? '');

  useEffect(() => {
    setValue(data[field]);
  }, [data[field]]);

  const useStyles = makeStyles({
    root: {
      fontSize: '14px',
      color: clinkBlack,
      fontWeight: data && data.title ? 'bold' : 'normal',
    },
  });
  const classes = useStyles();

  return (
    <TextField
      multiline
      value={value}
      variant="standard"
      onChange={(e) => {
        setValue(e.target.value);
      }}
      onBlur={() => {
        if (value !== data[field]) {
          const content = [...fullData].map((i) =>
            Number(i.id) === Number(data.id) && i[field] === data[field]
              ? { ...i, [field]: value }
              : i,
          );
          handleUpdateAttendance(did, content);
        }
      }}
      sx={{ width: '100%' }}
      InputProps={{ classes, disableUnderline: true }}
      placeholder={`Enter ${field}...`}
    />
  );
};

const AddAttendance = ({
  did,
  fullData,
  section = false,
  handleUpdateAttendance = () => null,
}) => {
  return (
    <Button
      variant="contained"
      color="success"
      onClick={() => {
        const nextId = String(fullData.length);
        const content = [
          ...fullData,
          section
            ? {
                id: nextId,
                description: '',
                title: true,
              }
            : {
                id: nextId,
                description: '',
                companyName: false,
                subcontractor: false,
              },
        ];
        handleUpdateAttendance(did, content);
      }}
    >
      {section ? 'Add section' : 'Add row'}
    </Button>
  );
};

const MiniboqInput = ({
  uniqueKey,
  data,
  fullData,
  did,
  handleLocalMiniBoq = () => null,
}) => {
  const [value, setValue] = useState(data.description ?? '');

  useEffect(() => {
    setValue(data.description);
  }, [data.description]);

  const useStyles = makeStyles({
    root: {
      fontSize: '14px',
      color: clinkBlack,
      fontWeight: data && data.title ? 'bold' : 'normal',
    },
  });
  const classes = useStyles();

  return (
    <TextField
      id={uniqueKey}
      multiline
      name="description"
      value={value}
      variant="standard"
      onChange={(e) => {
        setValue(e.target.value);
      }}
      onBlur={() => {
        if (data.description !== value) {
          const content = [...fullData].map((i) =>
            Number(i.id) === Number(data.id) ? { ...i, description: value } : i,
          );
          handleLocalMiniBoq(did, content);
        }
      }}
      sx={{ width: '100%', maxHeight: '40px' }}
      InputProps={{ classes, disableUnderline: true }}
      placeholder="Enter description..."
    />
  );
};

const MoneyInput = ({
  uniqueKey,
  data,
  name,
  fullData,
  did,
  handleLocalMiniBoq = () => null,
}) => {
  if (name === 'total') {
    return data && data[name]
      ? parseCurrency(data[name], currencyConfig[i18next.t('currency')])
      : '';
  }
  let initialValue =
    data && data[name] ? parseCurrency(data && data[name]) : '';
  if (name === 'quantity') {
    initialValue = (data && data[name]) ?? '';
  }
  const defaultValues = {
    [name]: initialValue,
  };

  return (
    <Form
      key={uniqueKey}
      data-testid={`form-content-${uniqueKey}-${name}`}
      disableUntilValid
      defaultValues={defaultValues}
      method="POST"
      render={(formHook) => {
        const { register, control, setValue, formState, trigger } = formHook;
        const { errors } = formState;
        return (
          <InputFormControlled
            className="currency-input"
            autoComplete={name}
            onChange={(e) => setChecked(e.target.value)}
            disabled={name === 'total'}
            onBlur={(e) => {
              const { value } = e.target;
              if (value !== initialValue) {
                const content = [...fullData].map((i) => {
                  if (Number(i.id) === Number(data.id)) {
                    const newValue = { [name]: value };
                    const otherValueName =
                      name === 'unit_price' ? 'quantity' : 'unit_price';
                    const total =
                      Number(value) && Number(data[otherValueName])
                        ? {
                            total: Number(value) * Number(data[otherValueName]),
                          }
                        : { total: null };
                    return { ...i, ...newValue, ...total };
                  }
                  return i;
                });
                handleLocalMiniBoq(did, content);
              }
            }}
            allowComma={false}
            name={name}
            type={name === 'unit_price' ? 'currency' : 'number'}
            placeholder={
              name === 'unit_price'
                ? parseCurrency(1000, currencyConfig[i18next.t('currency')])
                : '0'
            }
            theme="c-link"
            errors={errors}
            register={register}
            control={control}
            setValue={setValue}
            trigger={trigger}
            currencySymbol={i18next.t('currency')}
          />
        );
      }}
    />
  );
};

const PercentageInput = (props) => {
  const { value, onChange } = props;
  const [inputValue, setInputValue] = useState(value || '');

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  const handleChange = (event) => {
    const val = event.target.value;

    // Permitir solo números enteros
    if (/^\d*$/.test(val)) {
      let num = parseInt(val, 10);
      if (isNaN(num)) num = '';
      if (num >= 0 && num <= 100) {
        setInputValue(num);
        if (onChange) onChange(num);
      } else if (val === '') {
        setInputValue('');
        if (onChange) onChange('');
      }
    }
  };

  return (
    <TextField
      type="text"
      value={inputValue}
      onChange={handleChange}
      variant="outlined"
      sx={{
        height: '100%',
        '& .MuiInputBase-root': {
          height: '100%',
          alignItems: 'center',
          '&.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': {
              border: 0,
            },
          },
          '& .MuiInputBase-input': {
            textAlign: 'center',
            width: '40px',
            padding: '8px 0',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            border: 0,
          },
          '& .MuiInputAdornment-root': {
            marginLeft: 0,
          },
        },
        '& .Mui-focused': {
          outline: 'none !important',
          boxShadow: 'none !important',
        },
        '& .MuiInput-underline:before, & .MuiInput-underline:after': {
          display: 'none',
        },
      }}
      slotProps={{
        input: {
          endAdornment: <InputAdornment position="end">%</InputAdornment>,
        },
      }}
    />
  );
};

export {
  Div,
  Img,
  AttendanceCheckbox,
  DeleteButton,
  AddAttendance,
  AttendanceInput,
  MiniboqInput,
  MoneyInput,
  PercentageInput,
};
