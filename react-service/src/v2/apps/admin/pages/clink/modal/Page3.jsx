import React from 'react';
import { InputFormControlled } from 'clink-components';
import { useTranslation } from 'react-i18next';
import { Container, StyledItemAutocomplete, PageTitle } from './Modal.styled';

const Page3 = ({
  errors,
  register,
  setValue,
  control,
  trigger,
  subscriptionsList = [],
}) => {
  const { t } = useTranslation();
  return (
    <>
      <PageTitle>{t('membership_options')}</PageTitle>
      <Container>
        <StyledItemAutocomplete>
          <InputFormControlled
            autoComplete="subscription_id"
            errors={errors}
            placeholder="Select from list"
            name="subscription_id"
            type="select"
            register={register}
            setValue={setValue}
            control={control}
            options={subscriptionsList}
            trigger={() => trigger(['subscription_id'])}
            theme="pegasus"
            rules={{ required: 'subscription_id required' }}
            data-testid="modal-input-subscription"
          />
        </StyledItemAutocomplete>
      </Container>
    </>
  );
};

export default Page3;
