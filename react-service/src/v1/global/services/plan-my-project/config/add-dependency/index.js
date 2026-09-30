import * as Yup from 'yup';
import { ValidationSchemes } from '../../../clink';

const TENDER_RETURN = 1;
const START_ON_SITE = 2;
const TENDER_BUILDER_FORM = {
  INITIAL_VALUES: {
    name: {},
    dependency: {},
  },
  FORM_FIELDS: [
    {
      key: 'name',
      as: 'select',
      name: 'name',
      label: 'Trade name',
      className: 'tender-service',
      placeholder: 'Select trade',
      options: [
        {
          id: TENDER_RETURN,
          value: TENDER_RETURN,
          label: 'Tender return',
        },
        {
          id: START_ON_SITE,
          value: START_ON_SITE,
          label: 'Start on site',
        },
      ],
      required: true,
      labelError: true,
    },
    {
      key: 'dependency',
      as: 'select',
      name: 'dependency',
      placeholder: 'Select dependency',
      label: 'Dependencies date',
      className: 'tender-dependecy',
      options: [
        {
          id: TENDER_RETURN,
          value: TENDER_RETURN,
          label: 'Tender return',
        },
        {
          id: START_ON_SITE,
          value: START_ON_SITE,
          label: 'Start on site',
        },
      ],
      required: true,
      labelError: true,
    },
  ],
  VALIDATION_SCHEMA: Yup.object().shape({
    tenderService: ValidationSchemes.select,
    tenderDependency: ValidationSchemes.select,
  }),
};

export default TENDER_BUILDER_FORM;
