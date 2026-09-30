import React, { useState, useCallback } from 'react';
import { connect } from 'react-redux';
import { useContext } from 'v2/hooks/context';
import i18next from 'v2/helpers/i18n';
import AwardSVG from 'v1/quotes-tender/public/images/svg/award.svg';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import WithdrawSVG from 'v1/quotes-tender/public/images/svg/withdraw.svg';
import StarSVG from 'v1/quotes-tender/public/images/svg/star.svg';
import { pennyToFloat } from 'v1/quotes-tender/helpers/price';
import { Body } from 'v1/global/components/clink-form';
import AwardPackageService from 'v1/quotes-tender/services/award-package';
import { analytics } from 'v1/global/helpers/services';
import { modalRenderer, formRenderer, ButtonRenderer } from './index';

const WithdrawAwardComponent = (quote) => {
  const context = useContext('clink');
  const { actions } = context;

  const { id, tid, pid, dispatch } = quote;
  const withdraw = useCallback(
    () =>
      dispatch(
        actions.withdrawAward({
          id,
          tid,
          pid,
        }),
      ),
    [dispatch, id, tid, pid, actions],
  );
  return (
    <Tooltip title="Withdraw Award" arrow>
      <IconButton
        type="button"
        aria-label="Withdraw Award"
        size="large"
        onClick={withdraw}
      >
        <WithdrawSVG />
      </IconButton>
    </Tooltip>
  );
};

const service = new AwardPackageService();

const initialOrderValue = (price) =>
  `${i18next.t('currency')}${pennyToFloat(price)}`;

const ButtonComponent = (props) => {
  const { handleClick } = props;
  return (
    <Tooltip title="Award Package" arrow>
      <IconButton
        type="button"
        aria-label="Award Package"
        size="large"
        onClick={handleClick}
        name="award_package"
      >
        <StarSVG style={{ width: '30px', height: '30px' }} />
      </IconButton>
    </Tooltip>
  );
};

const RendererComponent = (props) => {
  const context = useContext('clink');
  const { actions } = context;

  const { setShow, sid, id, tid, pid, price, dispatch } = props;

  const [orderValue, setOrderValue] = useState(initialOrderValue(price));
  const [orderDate, setOrderDate] = useState(null);

  let disabledBtn = true;
  if (orderValue && orderDate && orderDate instanceof Date) {
    const test = orderValue
      .replace(/[0-9.£]+/g, '')
      .replace(/[0-9.$]+/g, '')
      .replace(/[0-9.€]+/g, '');
    disabledBtn = test.length !== 0;
    const decimal = orderValue.indexOf('.');
    if (decimal !== -1) {
      if (decimal === 1 || orderValue.length - decimal > 3) {
        disabledBtn = true;
      }
    }
  }

  const callback = (input) => {
    const { val, fieldName } = input;

    if (fieldName === 'order_value') {
      setOrderValue(val);
    }

    if (fieldName === 'order_date') {
      setOrderDate(val);
    }
  };

  const buttons = {
    submitButton: (awardProps) =>
      ButtonRenderer('Award Package', { ...awardProps, disabled: disabledBtn }),
    closeButton: (closeProps) =>
      ButtonRenderer(
        'Close',
        { ...closeProps, ...{ onClick: () => setShow(false) } },
        'error',
      ),
  };

  const { initialValues, formFields } = service;
  initialValues.order_value = `${i18next.t('currency')}${pennyToFloat(price)}`;

  const newFormFields = [...formFields].map((formField) => ({
    ...formField,
    callback,
  }));

  service.formFields = newFormFields;

  const award = useCallback(
    (data) => dispatch(actions.award(data)),
    [dispatch, actions],
  );

  return formRenderer(
    service,
    buttons,
    (data) => {
      return analytics('history.quote.awarded_manually', Number(sid), () =>
        award({ data, tid, id, pid, sid }).then(() => setShow(false)),
      );
    },
    ({ values, isSubmitting, status, setFieldValue, formVariables }) => {
      let auxFormFields = [...service.formFields];
      const [orderValueField, orderDateField] = auxFormFields;
      orderValueField.handleBlur = (event) => {
        if (!event.target.value.includes(i18next.t('currency'))) {
          setFieldValue(
            'order_value',
            `${i18next.t('currency')}${pennyToFloat(event.target.value)}`,
          );
        }
      };

      auxFormFields = [orderValueField, orderDateField];

      return (
        <Body
          initialValues={initialValues}
          callback={() => 'Submit success!'}
          className=""
          submitText="Submit"
          validateOnChange
          validateOnBlur
          enableReinitialize={false}
          AuxButton={() => null}
          Content={null}
          extraProps={{}}
          status={status}
          formFields={auxFormFields}
          values={values}
          setFieldValue={setFieldValue}
          validationFieldSchema={service.validationFieldSchema}
          formVariables={formVariables}
          isSubmitting={isSubmitting}
          SubmitButton={buttons.submitButton}
        />
      );
    },
  );
};

const AwardPackageComponent = (quote) => {
  const { subcontractor, id, tid, pid, price, dispatch } = quote;

  return modalRenderer(
    <div>
      <AwardSVG /> Award this package
    </div>,
    <>
      Before you award this package to <b>{subcontractor?.name}</b> enter
      details about the final Order Value
    </>,
    ButtonComponent,
    (props) => (
      <RendererComponent
        {...props}
        sid={subcontractor?.id}
        id={id}
        tid={tid}
        pid={pid}
        price={price}
        dispatch={dispatch}
      />
    ),
    'award-quote-modal',
  );
};

const WithdrawAward = connect()(WithdrawAwardComponent);
const AwardPackage = connect()(AwardPackageComponent);

export { AwardPackage, WithdrawAward };
