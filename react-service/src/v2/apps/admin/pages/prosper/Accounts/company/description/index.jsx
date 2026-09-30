import React from 'react';
import {
  Button,
  Panel,
  Form as ClinkForm,
  InputForm,
  InputFormControlled,
} from 'clink-components';
import { useTranslation } from 'react-i18next';
import CircularProgress from '@mui/material/CircularProgress';
import { StyledWithMarginAndLoader } from '../Theme.styled';
import { StyledDescriptionItem, StyledDescriptionItemContent } from './styled';

const CompanyDescription = ({ data, handleUpdate, loading }) => {
  const { t } = useTranslation();
  return (
    <Panel
      className="description"
      headerContent={<h2>{t('profile-company-description')}</h2>}
    >
      <ClinkForm
        disableUntilValid
        defaultValues={data}
        method="POST"
        onSubmit={handleUpdate}
        render={(formHook) => {
          const { formState, register, setValue, trigger, control, getValues } =
            formHook;
          const { errors, isDirty, isValid } = formState;
          const disabledSubmit = !isDirty || !isValid;
          const type = 'editor';
          const rules = {
            required: 'Required',
          };
          const { description: formDesc } = getValues();
          return (
            <StyledDescriptionItem className="description-item">
              <StyledDescriptionItemContent className="description-item-content">
                <InputForm
                  autoComplete="strapline"
                  label={t('profile-company-strapline')}
                  errors={errors}
                  defaultValue={data.strapline ?? ''}
                  name="strapline"
                  type="text"
                  register={register}
                  rules={rules}
                  placeholder="e.g Concrete Structures on time on budget with safety first."
                  data-testid="description-input-strapline"
                />
              </StyledDescriptionItemContent>
              <StyledDescriptionItemContent className="description-item-content description-box">
                <InputFormControlled
                  register={register}
                  control={control}
                  setValue={setValue}
                  autoComplete="description"
                  label={t('profile-company-description')}
                  errors={errors}
                  value={formDesc}
                  name="description"
                  type={type}
                  rules={rules}
                  trigger={trigger}
                  data-testid="description-input-description"
                />
              </StyledDescriptionItemContent>
              <StyledWithMarginAndLoader>
                {loading && <CircularProgress className="my-company-loading" />}
                <Button
                  id="submit-button"
                  type="submit"
                  layout="square"
                  color="prosperGreenButton"
                  disabled={disabledSubmit}
                  data-testid="description-button-save"
                >
                  {t('save')}
                </Button>
              </StyledWithMarginAndLoader>
            </StyledDescriptionItem>
          );
        }}
      />
    </Panel>
  );
};

export default CompanyDescription;
