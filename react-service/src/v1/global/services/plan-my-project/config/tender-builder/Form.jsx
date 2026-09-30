import React from 'react';
import * as Yup from 'yup';
import Typography from '@mui/material/Typography';
import InfoRounded from '@mui/icons-material/InfoRounded';
import { ValidationSchemes } from '../../../clink';
import {
  DATE_FORMAT,
  DATE_FORMAT_PLACEHOLDER,
} from '../../../../helpers/constants';
import ConfigureLeadTimes from './ConfigureLeadTimes';
import TenderDateModal from '../../add-dependency/TenderDateModal';
import Dependency from '../../add-dependency/Dependency';
import i18next from 'v2/helpers/i18n';
import { darkGray } from 'v2/constants/colors';

const getTenderBuilderForm = (project) => ({
  INITIAL_VALUES: {
    packageName: '',
    referenceNo: '',
    provider_folder: null,
    tenderReturnDate: '',
    tenderStartDate: '',
    tenderService: {},
    tenderSize: {},
    milestones: [],
  },
  FORM_FIELDS: [
    {
      key: 'packageName',
      type: 'text',
      name: 'packageName',
      label: `${i18next.t('package-name')}`,
      className: 'package-name',
      placeholder: `${i18next.t('package-name')}`,
      required: true,
      labelError: true,
    },
    project?.data?.version === 2
      ? {
          key: 'referenceNo',
          type: 'text',
          name: 'referenceNo',
          label: i18next.t('reference-no') + '.',
          className: 'reference-no',
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
          required: false,
          maxLength: 7,
        }
      : null,
    {
      key: 'tenderReturnDate',
      type: 'text',
      name: 'tenderReturnDate',
      label: `${i18next.t('tender-return-date')}`,
      className: 'tender-return-date',
      dateFormat: DATE_FORMAT,
      placeholder: DATE_FORMAT_PLACEHOLDER,
      calendar: true,
      required: true,
      labelError: true,
      recommended: true,
      notCloseOnClickOutside: true,
      FormModal: (props) => <TenderDateModal {...props} />,
      Aux: (props) => <Dependency {...props} />,
    },
    {
      key: 'tenderStartDate',
      type: 'text',
      name: 'tenderStartDate',
      label: `${i18next.t('start-on-site')}`,
      className: 'tender-start-date',
      dateFormat: DATE_FORMAT,
      placeholder: DATE_FORMAT_PLACEHOLDER,
      calendar: true,
      required: true,
      labelError: true,
      recommended: false,
      notCloseOnClickOutside: true,
      FormModal: (props) => <TenderDateModal {...props} />,
      Aux: (props) => <Dependency {...props} />,
      Modal: ({
        open,
        setOpen,
        packageName,
        startOnSiteDate,
        accountMilestones,
        packageMilestones,
        onSave,
      }) => (
        <ConfigureLeadTimes
          open={open}
          handleClose={() => setOpen(false)}
          pid={project?.data?.id}
          packageName={packageName}
          startOnSiteDate={startOnSiteDate}
          accountMilestones={accountMilestones}
          packageMilestones={packageMilestones}
          onSave={onSave}
        />
      ),
    },
    {
      key: 'tenderService',
      as: 'select',
      name: 'tenderService',
      label: `${i18next.t('select-service')}`,
      className: 'tender-service',
      options: [],
      required: true,
      labelError: true,
    },
    {
      key: 'tenderSize',
      as: 'select',
      name: 'tenderSize',
      label: `${i18next.t('select-size')}`,
      className: 'tender-size',
      options: [],
      required: true,
      labelError: true,
    },
    {
      key: 'provider_folder',
      as: 'select',
      name: 'provider_folder',
      label: `${i18next.t('select-asite-folder')}`,
      className: 'provider-folder',
      placeholder: `${i18next.t('select-asite-folder-placeholder')}`,
      // Populated dynamically when the package card form is opened.
      options: [],
      required: true,
      labelError: true,
    },
  ].filter(Boolean),
  VALIDATION_SCHEMA: Yup.object().shape({
    packageName: ValidationSchemes.basicText,
    referenceNo: Yup.string()
      .max(7, i18next.t('reference-no-7-chars-max'))
      .matches(/^[A-Za-z0-9-]*$/, i18next.t('reference-no-type-validation')),
    provider_folder: Yup.object()
      .nullable()
      .required(`${i18next.t('field-is-required')}`)
      .test(
        'is-not-null',
        `${i18next.t('field-is-required')}`,
        (value) => value !== null,
      )
      .shape({
        label: Yup.string().required(`${i18next.t('field-is-required')}`),
      }),
    tenderReturnDate: ValidationSchemes.basicDate,
    tenderStartDate: ValidationSchemes.basicDate,
    tenderService: ValidationSchemes.select,
    tenderSize: ValidationSchemes.select,
  }),
});

export default getTenderBuilderForm;
