import React from 'react';
import { SECTIONS } from 'v2/helpers/prequal/documents';
import toNumber from 'lodash/toNumber';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { parseFloatVal } from 'v2/helpers/currency';
import { MuiSubmitWrapper } from 'v2/apps/shared/components/company-v2/Mui.styled';
import Loading from 'v2/apps/shared/components/Loading';
import Number from 'v2/apps/shared/components/prequalification/v2/form/Number';
import { exportAttribute } from 'v2/helpers/data';
import Turnover from './Turnover';
import OrderValue from './OrderValue';
import BankDetails from './BankDetails';
import CIS from './CIS';

const Finance = ({
  contextType = 'prosper',
  aid,
  prequalificationV2,
  dispatch,
  setPage,
  page,
  changeCompanyData = () => null,
}) => {
  const { t } = useTranslation();
  const context = useContext(contextType);
  const { actions } = context;
  const {
    statusPreq,
    [SECTIONS.TUR]: turnover,
    [SECTIONS.INF]: company_information,
  } = prequalificationV2;
  const {
    max_order_value,
    min_order_value,
    num_current_contractors,
    num_current_employees,
  } = company_information;
  const isProsper = contextType === 'prosper';

  const effectiveChangeCompanyData = isProsper ? changeCompanyData : () => null;

  const bank_name = exportAttribute(company_information, 'bank_name');
  const address = exportAttribute(company_information, 'address');
  const sort_code = exportAttribute(company_information, 'sort_code');
  const account_number = exportAttribute(company_information, 'account_number');
  const vat_number = exportAttribute(company_information, 'vat_number');
  const utr_number = exportAttribute(company_information, 'utr_number');
  const collateral_warranties = exportAttribute(
    company_information,
    'collateral_warranties',
  );
  const performance_guarantee_bonds = exportAttribute(
    company_information,
    'performance_guarantee_bonds',
  );

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      bank_name,
      address,
      sort_code,
      account_number,
      vat_number,
      utr_number,
      collateral_warranties,
      performance_guarantee_bonds,
    },
  });

  const addTurnover = () => {
    if (!isProsper) return;
    dispatch(actions.addTurnover_V2());
  };
  const updateTurnover = (year, value, name = 'value') => {
    if (!isProsper) return;
    dispatch(actions.updateTurnover_V2({ year, value, name }));
  };

  const handleAddTurnover = (turnoverValues) => {
    Promise.all(
      turnoverValues.map((turn) => updateTurnover(turn.year, turn.value)),
    ).then(addTurnover);
  };
  // eslint-disable-next-line consistent-return
  const onSubmit = (dataForm) => {
    if (!isProsper) {
      return setPage(page + 1);
    }
    const {
      turnover: turnoverValue,
      turnover_profit: turnoverProfitValue,
      max_order_value: maxOrder,
      min_order_value: minOrder,
      num_current_contractors: numContractors,
      num_current_employees: numEmployees,
    } = dataForm;

    const formCompleted =
      turnoverValue.length &&
      parseFloatVal(maxOrder) &&
      parseFloatVal(minOrder);

    if (formCompleted) {
      const bodyCompanyInfo = {
        aid,
        num_current_employees: numEmployees,
        num_current_contractors: numContractors,
        min_order_value: parseFloatVal(minOrder),
        max_order_value: parseFloatVal(maxOrder),
        bank_name: exportAttribute(dataForm, 'bank_name'),
        address: exportAttribute(dataForm, 'address'),
        sort_code: exportAttribute(dataForm, 'sort_code'),
        account_number: exportAttribute(dataForm, 'account_number'),
        vat_number: exportAttribute(dataForm, 'vat_number'),
        utr_number: exportAttribute(dataForm, 'utr_number'),
        collateral_warranties: exportAttribute(
          dataForm,
          'collateral_warranties',
        ),
        performance_guarantee_bonds: exportAttribute(
          dataForm,
          'performance_guarantee_bonds',
        ),
      };
      const bodyTurnover = { aid };
      turnover.forEach((turn, index) => {
        const [value] = turnoverValue.filter(
          (_val, year) => toNumber(turn.year) === toNumber(year),
        );
        const newValue = parseFloatVal(value);

        const [valueProfit] = turnoverProfitValue.filter(
          (_val, year) => toNumber(turn.year) === toNumber(year),
        );
        const newValueProfit = parseFloatVal(valueProfit);

        bodyTurnover[`year${index + 1}`] = {
          id: turn.id || null,
          year: turn.year,
          profit_before_tax: isNaN(newValueProfit) ? '0' : newValueProfit,
          value: isNaN(newValue) ? '0' : newValue,
          active_trading: true,
        };
      });
      dispatch(actions.patchCompanyInformation_V2(bodyCompanyInfo))
        .then((result) => {
          const { success } = result && result.payload;
          if (success) {
            return dispatch(actions.patchTurnover_V2(bodyTurnover));
          }
          return { success: false };
        })
        .then((result) => {
          const { success } = result && result.payload;
          if (success) {
            dispatch(actions.updateSize_V2({ bodyTurnover, bodyCompanyInfo }));
            setPage(page + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
    }
  };

  return (
    <Box pt={4}>
      <Loading status={statusPreq.message} />
      {!statusPreq.message && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Turnover
            data={turnover}
            register={register}
            errors={errors}
            validation={{ minLength: { value: 1, message: 'Required' } }}
            updateTurnover={updateTurnover}
            handleAddTurnover={handleAddTurnover}
          />
          <BankDetails
            register={register}
            errors={errors}
            changeCompanyData={effectiveChangeCompanyData}
          />
          <CIS
            register={register}
            errors={errors}
            setValue={setValue}
            collateralWarranties={collateral_warranties}
            performanceGuaranteeBonds={performance_guarantee_bonds}
            validation={{ required: false }}
            changeCompanyData={effectiveChangeCompanyData}
          />
          <OrderValue
            min_order_value={min_order_value}
            max_order_value={max_order_value}
            register={register}
            errors={errors}
            validation={{ min: { value: 0.1, message: 'Required' } }}
            changeCompanyData={effectiveChangeCompanyData}
          />
          <Number
            sx={{ marginBottom: 1 }}
            label={t('number-of-employees')}
            name="num_current_employees"
            value={num_current_employees || 0}
            register={register}
            errors={errors}
            validation={{ min: { value: 0, message: 'Required' } }}
            changeCompanyData={effectiveChangeCompanyData}
          />
          <Number
            label={t('prequalification-num_current_contractors')}
            name="num_current_contractors"
            value={num_current_contractors || 0}
            register={register}
            errors={errors}
            validation={{ min: { value: 0, message: 'Required' } }}
            changeCompanyData={effectiveChangeCompanyData}
          />
          <MuiSubmitWrapper prequal>
            <Button
              id="submit-button"
              type="submit"
              color="success"
              variant="contained"
              size="large"
            >
              {isProsper ? t('save-continue') : t('next')}
            </Button>
          </MuiSubmitWrapper>
        </form>
      )}
    </Box>
  );
};

const mapStateToProps = (state) => ({
  prequalificationV2: state.prequalificationV2,
});

export default connect(mapStateToProps)(Finance);
