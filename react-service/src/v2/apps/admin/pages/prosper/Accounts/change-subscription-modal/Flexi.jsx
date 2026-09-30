import React from 'react';
import { Button, Form, InputFormControlled } from 'clink-components';
import i18next from 'v2/helpers/i18n';
import {
  MuiFormSubscription,
  MuiInputData,
  MuiSaveBtnContainer,
} from './Mui.styled';

const DEFAULT_TOKENS = 10;
const Flexi = ({ subscription, placeholder, modalProps, handleConfirm }) => (
  <MuiFormSubscription>
    <Form
      data-testid="form-content"
      disableUntilValid
      defaultValues={{
        flexiTokens: DEFAULT_TOKENS,
      }}
      method="PATCH"
      onSubmit={(values) => {
        const { flexiTokens } = values;
        if (handleConfirm) handleConfirm(subscription, { tokens: flexiTokens });
        modalProps.handleClose();
      }}
      render={(formHook) => {
        const { formState, register, control, setValue } = formHook;
        const { errors, isValid } = formState;
        return (
          <MuiInputData>
            <InputFormControlled
              control={control}
              setValue={setValue}
              autoComplete="flexiTokens"
              label={i18next.t('tokens')}
              errors={errors}
              register={register}
              placeholder={placeholder}
              name="flexiTokens"
              type="number"
              data-testid="flexi-input-tokens"
              rules={{
                valueAsNumber: true,
                onChange: (e) => {
                  const { target } = e;
                  const { name, value } = target;
                  if (!value || Number(value) < 0) {
                    setValue(name, 0);
                  }
                },
                validate: (value) => value > 0,
              }}
            />
            <MuiSaveBtnContainer>
              <Button
                type="submit"
                layout="square"
                color="blueButton"
                disabled={!isValid}
                data-testid="flexi-button-save"
              >
                {i18next.t('save')}
              </Button>
            </MuiSaveBtnContainer>
          </MuiInputData>
        );
      }}
    />
  </MuiFormSubscription>
);

export default Flexi;
