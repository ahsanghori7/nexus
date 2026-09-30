import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'clink-components';
import { useTranslation } from 'react-i18next';
import TwoStepModal from '../two-step-modal';
import StepOne from './StepOne';
import StepTwo from './StepTwo';
import { useDispatch } from 'react-redux';
import { useContext } from 'v2/hooks/context';
// import Button from '@mui/material/Button';

/**
 * Add to Supply Chain Modal
 * A two-step modal for adding subcontractors to the supply chain
 */
const AddToSupplyChainModal = ({
  account,
  trades = [],
  locations = [],
  customOpenElement = null,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch()
  const {actions} = useContext()




  const openElement = customOpenElement || (
    <Button layout="dropdown" align="left">
      {t('add-to-supply-chain')}
    </Button>
  );

  return (

  <>
  <style>
    {`
      .add-to-supply-chain-modal .modal-box{
        width: auto
      }

      `}
  </style>
    <TwoStepModal
      title={t('add-to-supply-chain')}
      Step1Component={StepOne}
      Step2Component={StepTwo}
      step1Props={{
        account,
        dispatch,
        actions,
      }}
      step2Props={{
        account,
        trades,
        locations,
      }}
      openElement={openElement}
      className="add-to-supply-chain-modal"
      />



    </>
  );
};

AddToSupplyChainModal.propTypes = {
  account: PropTypes.object,
  trades: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      label: PropTypes.string,
    })
  ),
  locations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      label: PropTypes.string,
    })
  ),
  onSuccess: PropTypes.func,
  customOpenElement: PropTypes.element,
  dispatch: PropTypes.func,
  actions: PropTypes.object,
};

export default AddToSupplyChainModal;
