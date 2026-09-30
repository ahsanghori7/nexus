import React, { useState } from 'react';
import AutocompleteMui from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import i18next from 'v2/helpers/i18n';
import {
  MuiFormSubscription,
  MuiSaveBtnContainer,
  MuiSaveBtn,
} from './Mui.styled';

const Regional = ({
  subscription,
  options,
  placeholder,
  modalProps,
  handleConfirm,
}) => {
  const [regions, setRegions] = useState([]);
  const handleSelectRegion = (option) => {
    let value = [];
    value = option && option.id ? [{ id: option.id }] : {};
    setRegions(value);
  };
  const disabledButton = regions && Boolean(!regions.length);
  return (
    <MuiFormSubscription>
      <AutocompleteMui
        sx={{ width: '100%' }}
        filterSelectedOptions
        options={options ?? []}
        label={i18next.t('region')}
        onChange={(event, newValue) => {
          handleSelectRegion(newValue);
        }}
        data-testid="regional-input-region"
        renderInput={(params) => (
          <TextField {...params} placeholder={placeholder} fullWidth />
        )}
      />
      <MuiSaveBtnContainer>
        <MuiSaveBtn
          handleClick={() => {
            if (handleConfirm) handleConfirm(subscription, { region: regions });
            modalProps.handleClose();
          }}
          disabled={disabledButton}
          data-testid="regional-button-save"
        >
          {i18next.t('save')}
        </MuiSaveBtn>
      </MuiSaveBtnContainer>
    </MuiFormSubscription>
  );
};

export default Regional;
