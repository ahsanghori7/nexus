import React from 'react';
import * as Yup from 'yup';
import { CONSTANTS } from 'clink-components';
import Typography from '@mui/material/Typography';
import InfoRounded from '@mui/icons-material/InfoRounded';
import { ValidationSchemes } from '../../../clink';
import { defaultStyles } from '../../../../components/clink-form/inputs/select-field/assets';
import i18next from 'i18next';
import { darkGray } from 'v2/constants/colors';

const { darkCharcoal } = CONSTANTS.colors.general;

const TENDER_BUILDER = {
  INITIAL_VALUES: {
    tenderBuilderPackages: [],
    missingTrades: {},
    packageName: '',
    referenceNo: '',
  },
  FORM_FIELDS: [
    {
      key: 'tenderBuilderPackages',
      type: 'checkbox',
      name: 'tenderBuilderPackages',
      label: null,
      className: 'tenderBuilderPackages ',
      options: [],
    },
    {
      key: 'missingTrades',
      as: 'select',
      name: 'missingTrades',
      placeholder: 'Start typing to see other trades...',
      label: (
        <>
          Missing trades? <span className="sublabel">Add more...</span>
        </>
      ),
      className: 'missing-trades',
      options: [],
      isMulti: false,
      styles: {
        ...defaultStyles,
        option: (provided, state) => ({
          ...provided,
          backgroundColor:
            state.isSelected || state.isFocused
              ? 'rgba(76,192,173, 0.13)'
              : '#fff',
          color: darkCharcoal,
          fontWeight: state.isSelected ? 'bold' : 'initial',
        }),
      },
    },
    {
      key: 'packageName',
      type: 'text',
      name: 'packageName',
      label: (isCustom) => `${isCustom ? 'Create' : 'Add'} a Package`,
      placeholder: 'Enter Package name here…',
      description: (isCustom) => (
        <>
          Your selected <b>Trades</b> will be combined into a single{' '}
          <b>Package</b> and shown top right. Simply give the Package a name and
          click &quot;{isCustom ? 'Create' : 'Add'} Package&quot;
        </>
      ),
      className: 'package-name',
      required: true,
    },
    {
      key: 'referenceNo',
      type: 'text',
      name: 'referenceNo',
      label: i18next.t('reference-no') + '.',
      placeholder: i18next.t('add-reference-no'),
      description: (
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <InfoRounded sx={{ fontSize: '14px', color: darkGray }} />
          {i18next.t('auto-generated-edit-to-customize')}
        </Typography>
      ),
      descriptionIcon: true,
      className: 'reference-no',
      required: false,
      maxLength: 7,
    },
  ],
  VALIDATION_SCHEMA: Yup.object().shape({
    tenderBuilderPackages: ValidationSchemes.arrayRequired,
    missingTrades: ValidationSchemes.select,
    packageName: ValidationSchemes.required,
  }),
  PAGE_VALIDATION_SCHEMA: [
    () =>
      Yup.object().shape({
        missingTrades: ValidationSchemes.select,
      }),
    () =>
      Yup.object().shape({
        tenderBuilderPackages: ValidationSchemes.arrayRequired,
        packageName: ValidationSchemes.required,
        referenceNo: Yup.string()
          .max(7, i18next.t('reference-no-7-chars-max'))
          .matches(
            /^[A-Za-z0-9-]*$/,
            i18next.t('reference-no-type-validation'),
          ),
      }),
  ],
};

export default TENDER_BUILDER;
