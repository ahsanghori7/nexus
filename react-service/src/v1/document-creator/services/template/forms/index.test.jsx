/**
 * Tests for the testId generation logic in TemplateService.getInput().
 *
 * CLP-3714: data-testids for document-creator dynamic fields.
 * Convention: document-creator-field-{kebab(dbKey)}
 */

jest.mock('v1/global/services/clink', () => {
  return class MockGlobalService {
    constructor() {
      this._initialValues = {};
      this._moneyInputs = [];
    }

    get initialValues() {
      return this._initialValues;
    }

    set initialValues(v) {
      this._initialValues = v;
    }

    get moneyInputs() {
      return this._moneyInputs;
    }

    set moneyInputs(v) {
      this._moneyInputs = v;
    }
  };
});

jest.mock('moment', () => {
  const m = () => ({ toDate: () => new Date() });
  return m;
});

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}));

jest.mock('@fortawesome/free-solid-svg-icons/faPlus', () => ({ faPlus: {} }));

jest.mock('react-select', () => ({ components: { Option: () => null } }));

jest.mock('v2/helpers/i18n', () => ({ default: { t: (k) => k } }));

jest.mock('v1/global/helpers/data', () => ({
  dateSubstract: () => null,
  getTextFromHTML: (s) => s || '',
}));

jest.mock('v2/helpers/date', () => ({ getDateValuesV1: () => ({}) }));

jest.mock('v1/document-creator/helpers/config', () => ({
  default: { hasHtmlCode: () => false },
}));

jest.mock('v1/global/services/Relay', () =>
  jest.fn().mockImplementation(() => ({})),
);

jest.mock('./config', () => ({
  default: {
    initialValues: {},
    formFields: [],
    validationSchema: {},
    submitUrl: '',
    method: 'POST',
    key: 'test',
  },
}));

jest.mock('./asyncCallMapping', () => ({
  __esModule: true,
  default: {},
  sow: {},
  nd: {},
}));

import Template from './index';

describe('TemplateService.getInput — testId generation (CLP-3714)', () => {
  let service;

  beforeEach(() => {
    service = new Template();
    service.signatureFields = {};
    service._slug = '';
    service.mapping = {};
    service.observerInputs = [];
    service.asyncInputs = {};
  });

  it('generates testId from dbKey for a text-type shortcode', () => {
    const result = service.getInput({
      code: '{SubcontractWorks}',
      type: 'text',
      dbKey: 'subcontract_works',
      label: 'Subcontract Works',
      value: '',
    });

    expect(result.testId).toBe('document-creator-field-subcontract-works');
  });

  it('generates testId from dbKey for an input-type shortcode', () => {
    const result = service.getInput({
      code: '{OrderValue}',
      type: 'input',
      dbKey: 'order_value',
      label: 'Order Value',
      value: '',
    });

    expect(result.testId).toBe('document-creator-field-order-value');
  });

  it('generates testId from dbKey for a hidden-type shortcode', () => {
    const result = service.getInput({
      code: '{OrderReference}',
      type: 'hidden',
      dbKey: 'order_ref',
      label: 'Order Reference',
      value: '',
    });

    expect(result.testId).toBe('document-creator-field-order-ref');
  });

  it('generates testId with multiple underscores replaced by hyphens', () => {
    const result = service.getInput({
      code: '{SignContractor}',
      type: 'input',
      dbKey: 'signature_main_contractor',
      label: 'Signature Main Contractor',
      value: '',
    });

    expect(result.testId).toBe(
      'document-creator-field-signature-main-contractor',
    );
  });

  it('preserves the key (dbKey) and name (from code) on the returned object', () => {
    const result = service.getInput({
      code: '{CompletionDate}',
      type: 'input',
      dbKey: 'completion_date',
      label: 'Completion Date',
      value: '',
    });

    expect(result.key).toBe('completion_date');
    expect(result.name).toBe('CompletionDate');
    expect(result.testId).toBe('document-creator-field-completion-date');
  });
});
