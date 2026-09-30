import React from 'react';
import i18next from 'v2/helpers/i18n';
import { Form, InputFormControlled } from 'clink-components';
import parseCurrency, { currencyConfig } from 'v2/helpers/currency';
import Relay from 'v2/services/relay';

const relay = new Relay('relay', '', '');
const rowBuilder = ({ data, pid, dispatch, action }) => {
  const {
    tid,
    package: pack,
    order,
    variations,
    omissions,
    budget,
    total,
    end,
  } = data;
  const formKey = `${tid}-budget`;
  const budgetValue = budget
    ? parseCurrency(budget, currencyConfig[i18next.t('currency')])
        .replace('£', '')
        .replace('€', '')
        .replace('$', '')
    : '';
  const handleBlur = (val) => {
    const value = Number(val.target.value) * 100;
    return relay
      .patch({ budget: value }, '', {
        action: 'project',
        method: 'updateProjectTender',
        id: pid,
        tid,
      })
      .then(() => {
        dispatch(action({ budget: value, tid }));
      });
  };
  const budgetCell = end ? (
    parseCurrency(
      String(budgetValue || 0).replace(',', ''),
      currencyConfig[i18next.t('currency')]
    )
  ) : (
    <Form
      key={formKey}
      data-testid="form-content"
      disableUntilValid
      defaultValues={{
        budget: budgetValue,
      }}
      method="POST"
      render={(formHook) => {
        const { register, control, setValue, formState, trigger } = formHook;
        const { errors } = formState;
        return (
          <InputFormControlled
            className="forecast-budget-input"
            autoComplete="budget"
            errors={errors}
            register={register}
            control={control}
            setValue={setValue}
            trigger={trigger}
            onBlur={handleBlur}
            allowComma={false}
            name="budget"
            type="currency"
            placeholder="1,000.00"
            theme="c-link"
          />
        );
      }}
    />
  );

  const omissionsCell = parseCurrency(
    -omissions,
    currencyConfig[i18next.t('currency')]
  );

  return {
    id: tid,
    package: pack,
    order: parseCurrency(order, currencyConfig[i18next.t('currency')]),
    variations: parseCurrency(
      variations,
      currencyConfig[i18next.t('currency')]
    ),
    omissions: (
      <span className={-omissions < 0 ? 'negative-value' : ''}>
        {omissionsCell}
      </span>
    ),
    budget: budgetCell,
    total: parseCurrency(total, currencyConfig[i18next.t('currency')]),
  };
};

export default rowBuilder;
